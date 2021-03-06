const Server = require('./core/Server');
const merge = require('./utils/merge');

const Aggregate = require('./core/Aggregate');
const CommandHandler = require('./core/CommandHandler');
const QueryHandler = require('./core/QueryHandler');

class Blackrik
{
    #config = {
        aggregates: [],
        readModels: [],
        sagas: [],
        readModelAdapters: {},
        eventStoreAdapter: {},
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
    _aggregates;

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
        }
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
        //TODO validate config
    }

    _initEventBus()
    {
        const {module, params} = this.config.eventBusAdapter;
        const create = require(module);
        if(typeof create !== 'function')
            throw Error(`EventBus '${module}' needs to be of type function.`);
        this._eventBus = create(params);
    }

    _processAggregates()
    {
        this._aggregates = Aggregate.fromArray(this.config.aggregates);
    }

    _processReadModels()
    {
        //TODO subscribe to events
    }

    async _processSagas()
    {
        //TODO outsource
        //TODO subscribe to events (keep in mind to detect whether we have a replay or not)
        const store = {}; //TODO get a store adapter
        const promises = [];
        this.config.sagas.forEach(({source}) => {
            promises.push(source.init());
            Object.entries(source).forEach(([eventType, handler]) => {
                const callback = async event => {
                    await handler(store, event);
                };
            });
        });
        return Promise.all(promises);
    }

    _processMiddlewares()
    {
        this.#server.use((req, res, next) => (req.blackrik = Object.freeze(this)) && next());

        const {middlewares} = this.config.server;
        if(!Array.isArray(middlewares))
            throw Error('config.server.middlewares needs to be an array.');
        middlewares.forEach(middleware => this.#server.use(...(Array.isArray(middleware) ? middleware : [middleware])));
    }

    _processAPI()
    {
        this.#server.route('/commands').post(new CommandHandler(this));
        this.#server.route('/query').get(new QueryHandler());

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

        this._processAggregates();
        this._processReadModels();
        await this._processSagas();

        this.#server = new Server(this.config.server.config);
        this._processMiddlewares();
        this._processAPI();
        this.#server.start();

        return this;
    }
}

module.exports = Blackrik;
