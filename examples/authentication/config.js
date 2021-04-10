const Blackrik = require('blackrik');

module.exports = {
    aggregates: [
        {
            name: 'user',
            commands: require('./aggregates/user.commands'),
            projection: require('./aggregates/user.projection')
        }
    ],
    readModels: [
        {
            name: 'user',
            projection: require('./readModels/user.projection'),
            resolvers: require('./readModels/user.resolvers'),
            adapter: 'default'
        }
    ],
    sagas: [
        {
            name: 'user',
            source: require('./sagas/user'),
            adapter: 'default'
        }
    ],
    adapter: 'default',
    readModelStoreAdapters: {
        default: {
            module: Blackrik.ADAPTERS.READMODELSTORE.MySQL,
            args: {
                host: 'localhost',
                database: 'readmodelstore',
                user: 'root',
                password: '1234'
            }
        }
    },
    eventStoreAdapter: {
        module: Blackrik.ADAPTERS.EVENTSTORE.MySQL,
        args: {
            host: 'localhost',
            database: 'eventstore',
            user: 'root',
            password: '1234'
        }
    },
    eventBusAdapter: {
        module: Blackrik.ADAPTERS.EVENTBUS.Kafka,
        args: {
            brokers: ['localhost:9092']
        }
        // module: Blackrik.ADAPTERS.EVENTBUS.Local,
        // args: {}
    },
    server: {
        middlewares: [
            require('./auth/middleware')
        ],
        routes: [
            {
                method: 'POST',
                path: '/login',
                callback: require('./auth/login')
            }
        ]
    }
};
