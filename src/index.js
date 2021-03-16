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
            module: defaultAdapters.EVENTBUS.Kafka,
            args: {
                clientId: 'blackrik-application'
            }
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

    #started = false;

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

    async executeCommand(command)
    {
        return !!await this.#blackrik._commandHandler.process(
            command,
            Object.freeze({blackrik: this})
        );
    }

    // scheduleCommand(crontime, command)
    // {

    // }

    async executeQuery(readModel, resolver, query)
    {
        return await this.#blackrik._queryHandler.process(
            readModel,
            resolver,
            query
        );
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
