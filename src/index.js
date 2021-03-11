const merge = require('./utils/merge');
const {validateConfig} = require('./utils/validation');
const defaultAdapters = Object.freeze(require('./adapters'));
const httpMethods = Object.freeze(require('./resources/httpMethods'));

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
            module: defaultAdapters.EVENTBUS.Kafka
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
    config;
    #blackrik;

    static get ADAPTERS()
    {
        return defaultAdapters;
    }

    static get HTTP_METHODS()
    {
        return httpMethods;
    }

    constructor(...configs)
    {
        this.config = merge(this.#config, ...configs);
        validateConfig(this.config);

        this.#blackrik = new Application(this);
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
        await this.#blackrik.start();
    }
}

module.exports = Blackrik;
