const merge = require('./utils/merge');
const {validateConfig} = require('./utils/validation');
const defaultAdapters = Object.freeze(require('./adapters'));
const httpMethods = Object.freeze(require('./resources/httpMethods'));
const Errors = Object.freeze(require('./core/Errors'));

const Application = require('./core/Blackrik');

class Blackrik
{
    #config = {
        aggregates: [],
        readModels: [],
        sagas: [],
        readModelStoreAdapters: {
            default: {
                module: defaultAdapters.READMODELSTORE.MySQL
            }
        },
        eventStoreAdapter: {
            module: defaultAdapters.EVENTSTORE.MySQL
        },
        eventBusAdapter: {
            module: defaultAdapters.EVENTBUS.Kafka,
            args: {
                clientId: 'blackrik-application'
            }
        },
        contextProvider: () => ({}),
        server: {
            config: {
                port: 3000,
                skipDefaultMiddlewares: false
            },
            middlewares: [],
            routes: []
        }
    };
    config;
    #blackrik;

    #started = false;

    static get ADAPTERS()
    {
        return defaultAdapters;
    }

    static get HTTP_METHODS()
    {
        return httpMethods;
    }

    static get ERRORS()
    {
        return Errors;
    }

    constructor(...configs)
    {
        this.config = merge(this.#config, ...configs);
        validateConfig(this.config);

        this.#blackrik = new Application(this);
    }

    executeCommand(command)
    {
        return this.#blackrik.executeCommand(command);
    }

    scheduleCommand(timestamp, command)
    {
        return this.#blackrik.scheduleCommand(timestamp, command);
    }

    get executeQuery()
    {
        return this.#blackrik.executeQuery;
    }

    async start()
    {
        if(this.#started)
            return;
        this.#started = true;
        await this.#blackrik.start();
    }
}

module.exports = Blackrik;
