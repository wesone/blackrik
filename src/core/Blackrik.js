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

        //TODO hook into defineTable to detect the need of a replay 
        // return new Proxy(this._stores[adapterName], {

        // });
    }

    async _createSubscriptions(eventMap, store)
    {
        const promises = [];
        Object.entries(eventMap).forEach(([eventType, handler]) => {
            promises.push(
                this._eventHandler.subscribe(eventType, async event => {
                    await handler(store, event);
                })
            );
        });
        return Promise.all(promises);
    }

    async _registerSubscribers(name, source, adapter)
    {
        if(this._subscribers[name])
            throw Error(`Duplicate ReadModel or Saga name '${name}'.`);

        if(!adapter)
            adapter = 'default';

        const store = this._createReadModelStore(adapter);
        if(typeof source.init === 'function')
            await source.init(store);
        await this._createSubscriptions(source, store);
        return (this._subscribers[name] = {
            source,
            adapter
        });
    }

    async _processReadModels()
    {
        const promises = [];
        this.config.readModels.forEach(({name, projection, resolvers, adapter}) => {
            promises.push(
                this._registerSubscribers(name, projection, adapter)
                    .then(({adapter}) => (this._resolvers[name] = {source: resolvers, adapter}))
            );
        });
        return Promise.all(promises);
    }

    async _processSagas()
    {
        const promises = [];
        this.config.sagas.forEach(({name, source, adapter}) => promises.push(this._registerSubscribers(name, source, adapter))); //TODO detect replay
        return Promise.all(promises);
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
        this.#server.route('/commands').post(new RequestHandler(this._commandHandler.handle));
        this._queryHandler = new QueryHandler(this);
        this.#server.route('/query/:readModel/:resolver').get(new RequestHandler(this._queryHandler.handle));
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
        await this._initEventHandler();
        await this._initEventStore();

        this._processAggregates();
        await this._processSubscribers();

        await this._eventHandler.start(); // needs to run after subscriptions

        this.#server = new Server(this.config.server.config);
        this._processMiddlewares();
        this._processAPI();
        this.#server.start();

        return this;
    }
}

module.exports = Blackrik;
