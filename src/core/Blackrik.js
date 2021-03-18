const CONSTANTS = require('./Constants');

const Server = require('./Server');
const Adapter = require('./Adapter');
const EventHandler = require('./EventHandler');

const Aggregate = require('./Aggregate');
const RequestHandler = require('./RequestHandler');
const CommandHandler = require('./CommandHandler');
const QueryHandler = require('./QueryHandler');

const httpMethods = require('../resources/httpMethods');

class Blackrik
{
    #instance;
    config;
    #server;

    #replayEvents = [];

    _eventHandler;
    _eventStore;
    _stores = {};

    _aggregates = {};
    _subscribers = {};
    _resolvers = {};

    _commandHandler;
    _queryHandler;

    constructor(instance)
    {
        this.#instance = instance;
        this.config = instance.config;
    }

    async _initEventHandler()
    {
        const eventBus = Adapter.create(this.config.eventBusAdapter);
        if(!eventBus)
            throw Error(`EventBus adapter '${this.config.eventBusAdapter.module}' is invalid.`);
        await eventBus.init();
        this._eventHandler = new EventHandler(this, eventBus);
    }

    async _initEventStore()
    {
        if(!(this._eventStore = Adapter.create(this.config.eventStoreAdapter)))
            throw Error(`EventStore adapter '${this.config.eventStoreAdapter.module}' is invalid.`);
        await this._eventStore.init();
    }

    _processAggregates()
    {
        this._aggregates = Aggregate.fromArray(this.config.aggregates);
    }

    _createReadModelStore(adapterName)
    {
        if(!this._stores[adapterName] && !(this._stores[adapterName] = Adapter.create(this.config.readModelStoreAdapters[adapterName])))
            throw Error(`ReadModel adapter '${adapterName}' is invalid.`);
        return this._stores[adapterName];
    }

    _wrapReadModelStore(adapter, handlers)
    {
        const blackrik = this;
        return new Proxy(this._createReadModelStore(adapter), {
            get: (target, prop) => {
                if(prop === 'defineTable')
                    return async function(...args){
                        const created = await target[prop](...args);
                        if(created) // mark readmodel events for replay
                            blackrik.#replayEvents.push(
                                ...Object.keys(handlers)
                                    .filter(event => event !== CONSTANTS.READMODEL_INIT_FUNCTION)
                            );
                        return created;
                    };
                return Reflect.get(...arguments);
            }
        });
    }

    async _createSubscriptions(eventMap, store, callback)
    {
        await Promise.all(
            Object.entries(eventMap).map(
                ([eventType, handler]) =>
                    eventType !== CONSTANTS.READMODEL_INIT_FUNCTION && 
                        this._eventHandler.subscribe(eventType, async event => {
                            await callback(handler, store, event);
                        })
            )
        );
    }

    async _registerSubscribers(name, handlers, adapter, callback)
    {
        if(this._subscribers[name])
            throw Error(`Duplicate ReadModel or Saga name '${name}'.`);

        if(!adapter)
            adapter = CONSTANTS.DEFAULT_ADAPTER;

        const store = this._wrapReadModelStore(adapter, handlers);
        if(typeof handlers[CONSTANTS.READMODEL_INIT_FUNCTION] === 'function')
            await handlers[CONSTANTS.READMODEL_INIT_FUNCTION](store);

        await this._createSubscriptions(handlers, store, callback);

        return (this._subscribers[name] = {
            handlers,
            adapter
        });
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
        return Promise.all(
            this.config.sagas.map(
                ({name, source: {handlers, sideEffects}, adapter}) =>
                    this._registerSubscribers(
                        name,
                        handlers,
                        adapter,
                        async (handler, store, event) => await handler(
                            store,
                            event,
                            new Proxy(sideEffects, {
                                get: (target, prop) => {
                                    //TODO add blackrick instance functions
                                    //TODO maybe return noop function if event.isReplay === true
                                    return Reflect.get(...arguments);
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
        this._commandHandler = new CommandHandler(this);
        this.#server.route(CONSTANTS.ROUTE_COMMAND).post(new RequestHandler(this._commandHandler.handle));
        this._queryHandler = new QueryHandler(this);
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
        console.log('Initialize EventHandler');
        await this._initEventHandler();
        console.log('Initialize EventStore');
        await this._initEventStore();

        console.log('Process Aggregates');
        this._processAggregates();
        console.log('Process Subscribers');
        await this._processSubscribers();

        console.log('Start EventHandler');
        await this._eventHandler.start(); // needs to run after subscriptions

        if(this.#replayEvents.length)
        {
            console.log('Replaying events:', this.#replayEvents.join(', '));
            await this._eventHandler.replayEvents(this.#replayEvents);
        }

        this.#server = new Server(this.config.server.config);
        this._processMiddlewares();
        this._processAPI();
        this.#server.start();

        return this;
    }
}

module.exports = Blackrik;
