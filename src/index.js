const merge = require('./utils/merge');
const {validateConfig} = require('./utils/validation');

const Server = require('./core/Server');
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
                module: './adapters/readmodel-mysql'
            }
        },
        eventStoreAdapter: {
            module: './adapters/eventstore-mysql'
        },
        eventBusAdapter: {
            module: './adapters/eventbus-kafka'
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
    _readModels = {};
    _sagas = {};

    static get ADAPTERS()
    {
        return {
            EVENTBUS: {
                Kafka: './adapters/eventbus-kafka'
            },
            EVENTSTORE: {
                MySQL: './adapters/eventstore-mysql'
            },
            READMODEL: {
                MySQL: './adapters/readmodel-mysql'
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

    _createAdapter(adapter)
    {
        if(!adapter)
            return null;
        const {module, args} = adapter;
        const create = require(module);
        if(typeof create === 'function')
            return create(args);
        return null;
    }

    _initEventBus()
    {
        const bus = this._createAdapter(this.config.eventBusAdapter);
        if(!bus)
            throw Error(`EventBus adapter '${this.config.eventBusAdapter.module}' is invalid.`);
        this._eventBus = new EventBus(this, bus);
    }

    _initEventStore()
    {
        if(!(this._eventStore = this._createAdapter(this.config.eventStoreAdapter)))
            throw Error(`EventStore adapter '${this.config.eventStoreAdapter.module}' is invalid.`);
    }

    _processAggregates()
    {
        this._aggregates = Aggregate.fromArray(this.config.aggregates);
    }

    _createReadModelAdapter(adapterName)
    {
        if(!adapterName)
            adapterName = 'default';
        if(!this._stores[adapterName] && !(this._stores[adapterName] = this._createAdapter(this.config.readModelAdapters[adapterName])))
            throw Error(`ReadModel adapter '${adapterName}' is invalid.`);
    }

    _createReadModelSubscriptions(eventMap, store)
    {
        Object.entries(eventMap).forEach(([eventType, handler]) => {
            this._eventBus.subscribe(eventType, async event => {
                await handler(store, event);
            });
        });
    }

    async _processReadModels()
    {
        const promises = [];
        this.config.readModels.forEach(readModel => {
            const {name, projection, adapter} = readModel;
            this._createReadModelAdapter(adapter);

            //TODO validation
            this._readModels[name] = readModel;

            //TODO outsource
            const store = this._stores[adapter];
            promises.push(projection.init(store));
            this._createReadModelSubscriptions(projection, store);
        });
        return Promise.all(promises);
    }

    async _processSagas()
    {
        const promises = [];
        this.config.sagas.forEach(saga => {
            const {name, source, adapter} = saga;
            this._createReadModelAdapter(adapter);

            //TODO validation
            this._sagas[name] = saga;

            //TODO outsource
            const store = this._stores[adapter];
            promises.push(source.init(store));
            this._createReadModelSubscriptions(source, store); //TODO detect replay
        });
        return Promise.all(promises);
    }

    _processMiddlewares()
    {
        this.#server.use((...[req, , next]) => (req.blackrik = Object.freeze(this)) && next());

        const {middlewares} = this.config.server;
        if(!Array.isArray(middlewares))
            throw Error('config.server.middlewares needs to be an array.');
        middlewares.forEach(middleware => this.#server.use(...(Array.isArray(middleware) ? middleware : [middleware])));
    }

    _processAPI()
    {
        this.#server.route('/commands').post(new CommandHandler(this));
        this.#server.route('/query/:readModel/:resolver').get(new QueryHandler(this));

        const {routes} = this.config.server;
        if(!Array.isArray(routes))
            throw Error('config.server.routes needs to be an array.');
        routes.forEach(({method, path, callback}) => {
            method = method.toLowerCase();
            if(!this.constructor.HTTP_METHODS.includes(method))
                throw Error(`Method '${method.toUpperCase()}' is invalid.`);
            if(typeof callback !== 'function')
                throw Error('Parameter \'callback\' needs to be of type function.');
            if(!path.startsWith('/'))
                path = '/' + path;
            //TODO should we check for reserved routes (e.g. /commands) and throw?
            this.#server.route(path)[method](callback);
        });
    }

    executeCommand(command)
    {

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
        await this._processReadModels();
        await this._processSagas();

        this.#server = new Server(this.config.server.config);
        this._processMiddlewares();
        this._processAPI();
        this.#server.start();

        return this;
    }
}

module.exports = Blackrik;
