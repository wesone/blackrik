const merge = require('./utils/merge');
const {validateConfig} = require('./utils/validation');

const Server = require('./core/Server');
const Adapter = require('./core/Adapter');
const EventBus = require('./core/EventBus');

const Aggregate = require('./core/Aggregate');
const CommandHandler = require('./core/CommandHandler');
const QueryHandler = require('./core/QueryHandler');

class Blackrik
{
    #config = {
        aggregates: [],
        readModels: [],
        sagas: [],
        readModelAdapters: {
            default: {
                module: __dirname + '/adapters/readmodel-mysql'
            }
        },
        eventStoreAdapter: {
            module: __dirname + '/adapters/eventstore-mysql'
        },
        eventBusAdapter: {
            module: __dirname + '/adapters/eventbus-kafka'
        },
        server: {
            config: {
                port: 3000,
                skipDefaultMiddlewares: false
            },
            middlewares: [],
            routes: []
        }
    };
    #server;

    _eventBus;
    _eventStore;
    _stores = {};

    _aggregates = {};
    _subscribers = {};
    _resolvers = {};

    static get ADAPTERS()
    {
        return {
            EVENTBUS: {
                Kafka: __dirname + '/adapters/eventbus-kafka'
            },
            EVENTSTORE: {
                MySQL: __dirname + '/adapters/eventstore-mysql'
            },
            READMODEL: {
                MySQL: __dirname + '/adapters/readmodel-mysql'
            }
        };
    }

    static get HTTP_METHODS()
    {
        return [
            'head',
            'options',
            'get',
            'post',
            'put',
            'patch',
            'delete',
            'all'
        ];
    }

    constructor(...configs)
    {
        this.config = merge(this.#config, ...configs);
        validateConfig(this.config);
    }

    _initEventBus()
    {
        const bus = Adapter.create(this.config.eventBusAdapter);
        if(!bus)
            throw Error(`EventBus adapter '${this.config.eventBusAdapter.module}' is invalid.`);
        this._eventBus = new EventBus(this, bus);
    }

    _initEventStore()
    {
        if(!(this._eventStore = Adapter.create(this.config.eventStoreAdapter)))
            throw Error(`EventStore adapter '${this.config.eventStoreAdapter.module}' is invalid.`);
    }

    _processAggregates()
    {
        this._aggregates = Aggregate.fromArray(this.config.aggregates);
    }

    _createReadModelStore(adapterName)
    {
        if(!this._stores[adapterName] && !(this._stores[adapterName] = Adapter.create(this.config.readModelAdapters[adapterName])))
            throw Error(`ReadModel adapter '${adapterName}' is invalid.`);
        return this._stores[adapterName];
    }

    _createSubscriptions(eventMap, store)
    {
        Object.entries(eventMap).forEach(([eventType, handler]) => {
            this._eventBus.subscribe(eventType, async event => {
                await handler(store, event);
            });
        });
    }

    async _registerSubscribers(name, source, adapter)
    {
        if(!adapter || !adapter.length)
            adapter = 'default';

        const store = this._createReadModelStore(adapter);
        if(this._subscribers[name])
            throw Error(`Duplicate ReadModel or Saga name '${name}'.`);
        await source.init(store);
        this._createSubscriptions(source, store);
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
        this.#server.use((...[req, , next]) => (req.blackrik = Object.freeze(this)) && next());
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
        this.#server.route('/commands').post(new CommandHandler(this));
        this.#server.route('/query/:readModel/:resolver').get(new QueryHandler(this));
    }

    _registerAPI()
    {
        const {routes} = this.config.server;
        routes.forEach(({method, path, callback}) => {
            method = method.toLowerCase();
            if(!this.constructor.HTTP_METHODS.includes(method))
                throw Error(`Method '${method.toUpperCase()}' is invalid.`);

            if(!path.startsWith('/'))
                path = '/' + path;

            //TODO should we check for reserved routes (e.g. /commands) and throw?
            this.#server.route(path)[method](callback);
        });
    }

    _processAPI()
    {
        this._registerInternalAPI();
        this._registerAPI();
    }

    executeCommand(command)
    {
        //TODO handle req, res objects
    }

    // scheduleCommand(crontime, command)
    // {

    // }

    // publishEvent(event)
    // {

    // }

    async start()
    {
        this._initEventBus();
        this._initEventStore();

        this._processAggregates();
        await this._processSubscribers();

        this.#server = new Server(this.config.server.config);
        this._processMiddlewares();
        this._processAPI();
        this.#server.start();

        return this;
    }
}

module.exports = Blackrik;
