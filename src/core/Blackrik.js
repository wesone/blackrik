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

const httpMethods = require('../resources/httpMethods');

class Blackrik
{
    #instance;
    config;
    #server;

    #replayEvents = [];

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

    async _registerSubscribers(name, handlers, adapter, callback)
    {
        if(!adapter)
            adapter = CONSTANTS.DEFAULT_ADAPTER;

        const store = new ReadModelStore(this._createReadModelStore(adapter), handlers);
        if(await store.init())
            this.#replayEvents.push([
                name,
                Object.keys(handlers)
                    .filter(event => event !== CONSTANTS.READMODEL_INIT_FUNCTION)
            ]);

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
                ({name, projection, resolvers, adapter}) => 
                    this._registerSubscribers(name, projection, adapter, async (handler, store, event) => await handler(store, event))
                        .then(({adapter}) => (this._resolvers[name] = {handlers: resolvers, adapter}))
            )
        );
    }

    async _processSagas()
    {
        const blackrik = this;
        return Promise.all(
            this.config.sagas.map(
                ({name, source: {handlers, sideEffects}, adapter}) =>
                    this._registerSubscribers(
                        name,
                        handlers,
                        adapter,
                        async (handler, store, event, config) => await handler(
                            store,
                            event,
                            new Proxy(sideEffects, {
                                get: (target, prop, ...rest) => {
                                    if(event.isReplay && config.noopSideEffectsOnReplay !== false)
                                        return () => {};
                                    
                                    for(const [fn, argCount] of Object.entries({
                                        'executeCommand': 1,
                                        'scheduleCommand': 2
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
                            })
                        )
                    )
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
        this.#server.use((...[req, , next]) => (req.blackrik = Object.freeze(this.#instance)) && next());
    }

    _registerMiddlewares()
    {
        const {middlewares} = this.config.server;
        middlewares.forEach(middleware => this.#server.use(...(Array.isArray(middleware) ? middleware : [middleware])));
    }

    _processMiddlewares()
    {
        this._registerInternalMiddlewares();
        this._registerMiddlewares();
    }

    _registerInternalAPI()
    {
        this.#server.route(CONSTANTS.ROUTE_COMMAND).post(new RequestHandler(this._commandHandler.handle));
        this.#server.route(CONSTANTS.ROUTE_QUERY).get(new RequestHandler(this._queryHandler.handle));
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

            this.#server.route(path)[method](callback);
        });
    }

    _processAPI()
    {
        this._registerInternalAPI();
        this._registerAPI();
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

        if(this.#replayEvents.length)
        {
            console.log('Replaying events:', this.#replayEvents.map(([, types]) => types.join(', ')).join(', '));
            await this._eventHandler.replayEvents(this.#replayEvents);
        }

        this.#server = new Server(this.config.server.config);
        this._processMiddlewares();
        this._processAPI();
        await this.#server.start();

        return this;
    }

    async executeCommand(command, causationEvent = null)
    {
        const context = {blackrik: this.#instance};
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
            query
        );
    }
}

module.exports = Blackrik;
