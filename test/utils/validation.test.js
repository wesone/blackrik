const {validateConfig} = require('../../src/utils/validation');
const configs = require('../../examples/hello-world/config');
const merge = require('../../src/utils/merge');
const defaultAdapters = Object.freeze(require('../../src/adapters'));
const config = {
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

test('Validate config scheme', () => {
    expect(() => validateConfig(merge(config, configs))).not.toThrow();
});
