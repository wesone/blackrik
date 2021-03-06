const Server = require('./core/Server');
const merge = require('./utils/merge');

const EventBus = require('./core/EventBus');
const Aggregates = require('./core/Aggregates');
const CommandHandler = require('./core/CommandHandler');
const QueryHandler = require('./core/QueryHandler');

class Blackrik
{
    #config = {
        aggregates: [],
        readModels: [],
        sagas: [],
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

    constructor(config)
    {
        this.config = merge(this.#config, config);

        this._eventBus = new EventBus(); //TODO add eventbus options
        this._processAggregates();
        this._processReadModels();
        this._processSagas();

        this.#server = new Server(this.config.server.config);
        this._processMiddlewares();
        this._processAPI();
        this.#server.start();
    }

    _processAggregates()
    {
        this._aggregates = Aggregates.transform(this.config.aggregates);

        //TODO outsource
        Object.values(this._aggregates).forEach(({projection}) => {
            Object.keys(projection).forEach(type => {
                if(type === 'default')
                    return;
                //TODO subscribe to type
                const callback = async event => {
                    //TODO load aggregate state
                    const state = {};
                    const handler = projection[type];
                    const newState = await handler(state, event);
                    //TODO persist newState
                }
            });
        });
    }

    _processReadModels()
    {
        //TODO subscribe to events
        this.config.readModels.forEach(readModel)
    }

    _processSagas()
    {
        //TODO subscribe to events
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
}

module.exports = Blackrik;
