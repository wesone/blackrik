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
    readModelStoreAdapters: {
        default: {
            args: {
                debugSql: true,
                host: 'localhost',
                database: 'readmodelstore',
                user: 'root',
                password: '1234'
            }
        }
    },
    eventStoreAdapter: {
        args: {
            host: 'localhost',
            database: 'eventstore',
            user: 'root',
            password: '1234'
        }
    },
    eventBusAdapter: {
        args: {
            brokers: ['localhost:9092']
        }
        // module: Blackrik.ADAPTERS.EVENTBUS.Local,
        // args: {}
    },
    server: {
        config: {
            port: 3000,
            skipDefaultMiddlewares: false
        },
        middlewares: [
            (req, res, next) => next(),
            [
                '/middleware/test',
                (req, res, next) => next(),
                (req, res, next) => next()
            ]
        ],
        routes: [
            {
                method: 'GET',
                path: '/test',
                callback: (req, res) => {
                    console.log('CALLED /TEST');
                }
            }
        ]
    }
};
