const CONSTANTS = require('./Constants');

const Server = require('./Server');
const Adapter = require('./Adapter');
const EventHandler = require('./EventHandler');
const ReadModelStore = require('./ReadModelStore');

const Aggregate = require('./Aggregate');
const RequestHandler = require('./RequestHandler');
const CommandHandler = require('./CommandHandler');
const QueryHandler = require('./QueryHandler');
const CommandScheduler = require('./CommandScheduler');

const Workflow = require('./workflow');

const httpMethods = require('../resources/httpMethods');

class Blackrik
{
    #instance;
    config;
    #server;

    #replayEvents = {};

    #store;
    _eventHandler;
    _eventStore;
    _stores = {};

    _aggregates = {};
    _resolvers = {};

    _commandHandler;
    _queryHandler;
    _commandScheduler;

    constructor(instance)
    {
        this.#instance = instance;
        this.config = instance.config;

        this.executeCommand = this.executeCommand.bind(this);
        this.scheduleCommand = this.scheduleCommand.bind(this);
        this.executeQuery = this.executeQuery.bind(this);
    }

    _createReadModelStore(adapterName)
    {
        if(!this._stores[adapterName] && !(this._stores[adapterName] = Adapter.create(this.config.readModelStoreAdapters[adapterName])))
            throw Error(`ReadModel adapter '${adapterName}' is invalid.`);
        return this._stores[adapterName];
    }

    async _initStore()
    {
        this.#store = this._createReadModelStore(this.config.adapter || 'default');
    }

    async _initEventStore()
    {
        if(!(this._eventStore = Adapter.create(this.config.eventStoreAdapter)))
            throw Error(`EventStore adapter '${this.config.eventStoreAdapter.module}' is invalid.`);
        await this._eventStore.init();
    }

    async _initEventHandler()
    {
        const eventBus = Adapter.create(this.config.eventBusAdapter);
        if(!eventBus)
            throw Error(`EventBus adapter '${this.config.eventBusAdapter.module}' is invalid.`);
        await eventBus.init();
        this._eventHandler = new EventHandler(this._eventStore, eventBus, this.#store);
        await this._eventHandler.init();
    }

    _processAggregates()
    {
        this._aggregates = Aggregate.fromArray(this.config.aggregates);
    }

    async _createSubscriptions(name, eventMap, store, callback)
    {
        await Promise.all(
            Object.entries(eventMap).map(
                ([eventType, handler]) =>
                    eventType !== CONSTANTS.READMODEL_INIT_FUNCTION && 
                        this._eventHandler.subscribe(name, eventType, async event => { 
                            await callback(
                                handler,
                                store.createProxy(event),
                                event,
                                store.config
                            );
                        })
            )
        );
    }

    _addToReplay(name, handlers)
    {
        if(!this.#replayEvents[name])
            this.#replayEvents[name] = [];
        this.#replayEvents[name].push(
            ...Object.keys(handlers)
                .filter(event => event !== CONSTANTS.READMODEL_INIT_FUNCTION && !this.#replayEvents[name].includes(event))
        );
    }

    async _registerSubscribers(name, handlers, adapter, callback)
    {
        if(!adapter)
            adapter = CONSTANTS.DEFAULT_ADAPTER;

        const store = new ReadModelStore(this._createReadModelStore(adapter), handlers);
        if(await store.init())
            this._addToReplay(name, handlers);

        await this._createSubscriptions(name, handlers, store, callback);

        return {
            handlers,
            adapter
        };
    }

    async _processReadModels()
    {
        return Promise.all(
            this.config.readModels.map(
                async ({name, projection, resolvers, adapter}) => 
                    this._registerSubscribers(name, projection, adapter, async (handler, store, event) => await handler(store, event))
                        .then(({adapter}) => (this._resolvers[name] = {handlers: resolvers, adapter}))
            )
        );
    }

    _getSideEffectsProxy(sideEffects, event, config)
    {
        const blackrik = this;
        return new Proxy(sideEffects, {
            get: (target, prop, ...rest) => {
                if(event.isReplay && config.noopSideEffectsOnReplay !== false)
                    return () => {};
                
                for(const [fn, argCount] of Object.entries({
                    'executeCommand': 1,
                    'scheduleCommand': 2,
                    'deleteEventStream': 2,
                }))
                {
                    if(prop !== fn)
                        continue;
                    return function(...args){
                        const params = [
                            ...args.slice(0, argCount),
                            event
                        ];
                        return this[fn](...params);
                    }.bind(blackrik);
                }

                return Reflect.get(target, prop, ...rest);
            }
        });
    }

    async _processSagas()
    {
        return Promise.all(
            this.config.sagas.map(
                async ({name, source, adapter}) => {
                    const {handlers, sideEffects} = source.initial === undefined
                        ? source
                        : new Workflow(source).connect();

                    return this._registerSubscribers(
                        name,
                        handlers,
                        adapter,
                        async (handler, store, event, config) => await handler(
                            store,
                            event,
                            this._getSideEffectsProxy(sideEffects, event, config)
                        )
                    );
                }
            )
        );
    }

    async _processSubscribers()
    {
        return Promise.all([
            this._processReadModels(),
            this._processSagas()
        ]);
    }

    async _initHandlers()
    {
        this._commandHandler = new CommandHandler(this);
        this._queryHandler = new QueryHandler(this);

        this._commandScheduler = new CommandScheduler(this.executeCommand, this.#store);
        await this._commandScheduler.init();
    }

    _registerInternalMiddlewares()
    {
        const instance = Object.freeze(this.#instance);
        this.#server.use((...[req, , next]) => (req.blackrik = instance) && next());
    }

    _registerMiddlewares()
    {
        const {middlewares} = this.config.server;
        // middlewares.forEach(middleware => this.#server.use(...(Array.isArray(middleware) ? middleware : [middleware]))); // Express 5 (or higher)
        // Express < 5
        middlewares.forEach(middleware => {
            if(Array.isArray(middleware))
            {
                const [path, ...callbacks] = middleware;
                middleware = [path, ...callbacks.map(callback => RequestHandler.catch(callback))];
            }
            else 
                middleware = [RequestHandler.catch(middleware)];
            this.#server.use(...middleware);
        });
    }

    _registerErrorHandlingMiddlewares()
    {
        // http://expressjs.com/en/guide/error-handling.html
        // Asynchronous route handlers, middleware must call next(err) otherwise it's an unhandled error
        // Starting with Express 5 route handlers and middleware that return a Promise will call next(value) automatically when they reject or throw an error

        //TODO use this when Express 5 is production ready
        // this.#server.use((e, req, res, next) => {
        //     if(!e.status)
        //     {
        //         console.error(e);
        //         return res.sendStatus(500).end(); // do not expose critical errors
        //     }
        //     return res.status(e.status).send(e.message || e).end();
        // });
    }

    _processMiddlewares()
    {
        this._registerInternalMiddlewares();
        this._registerMiddlewares();
    }

    _registerInternalAPI()
    {
        const commandRequestHandler = new RequestHandler(this._commandHandler.handle);
        this.#server.route(CONSTANTS.ROUTES.COMMANDS).post(commandRequestHandler);
        this.#server.route(CONSTANTS.ROUTES.COMMAND).post(commandRequestHandler);
        this.#server.route(CONSTANTS.ROUTES.QUERY).get(new RequestHandler(this._queryHandler.handle));
    }

    _registerAPI()
    {
        const {routes} = this.config.server;
        routes.forEach(({method, path, callback}) => {
            method = method.toLowerCase();
            if(!httpMethods.includes(method))
                throw Error(`Method '${method.toUpperCase()}' is invalid.`);

            if(!path.startsWith('/'))
                path = '/' + path;

            // this.#server.route(path)[method](callback);
            this.#server.route(path)[method](RequestHandler.catch(callback));
        });
    }

    _processAPI()
    {
        this._registerInternalAPI();
        this._registerAPI();
    }

    buildContext(req = null)
    {
        return {
            ...(this.config?.contextProvider(req) ?? {})
        };
    }

    async _handleReplay()
    {
        const list = Object.entries(this.#replayEvents);
        if(list.length)
        {
            console.log('Replaying events:', list.map(([, types]) => types.join(', ')).join(', '));
            await this._eventHandler.replayEvents(list);
        }
    }

    async start()
    {
        await this._initStore();

        console.log('Initialize EventStore');
        await this._initEventStore();
        console.log('Initialize EventHandler');
        await this._initEventHandler();

        console.log('Process Aggregates');
        this._processAggregates();
        console.log('Process Subscribers');
        await this._processSubscribers();

        console.log('Start EventHandler');
        await this._eventHandler.start(); // needs to run after subscriptions

        console.log('Initialize Handlers');
        await this._initHandlers();

        await this._handleReplay();

        this.#server = new Server(this.config.server.config);
        this._processMiddlewares();
        this._processAPI();
        this._registerErrorHandlingMiddlewares();
        await this.#server.start();

        return this;
    }

    async stop()
    {
        await this.#server.stop();
        await this._eventHandler.stop();
        await this._eventStore.close();
        await Promise.all(Object.values(this._stores).map(store => store.close()));
    }

    async executeCommand(command, causationEvent = null)
    {
        const context = this.buildContext();
        if(causationEvent)
            context.causationEvent = causationEvent;
        return !!await this._commandHandler.process(
            command,
            context
        );
    }

    async scheduleCommand(timestamp, command, causationEvent = null)
    {
        return !!await this._commandScheduler.process(
            timestamp,
            command,
            causationEvent
        );
    }

    async executeQuery(readModel, resolver, query)
    {
        return await this._queryHandler.process(
            readModel,
            resolver,
            query,
            this.buildContext()
        );
    }

    async deleteEventStream(aggregateId, excludeTypes = null)
    {
        return await this._eventStore.delete(aggregateId, excludeTypes);
    }
}

module.exports = Blackrik;
