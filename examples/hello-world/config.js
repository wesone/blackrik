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
        },
        {
            name: 'user',
            source: require('./sagas/userEmailChange'),
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
        config: {
            port: 3000,
            skipDefaultMiddlewares: false
        },
        middlewares: [
            // a middleware for all routes
            (req, res, next) => (req.test = 21) && next(),
            // a middleware for /test only
            [ 
                '/test',
                (req, res, next) => (req.test = 42) && next()
            ]
        ],
        routes: [
            {
                method: 'GET',
                path: '/test',
                callback: (req, res) => {
                    console.log('CALLED /test; req.test is', req.test);
                    res.json({middlewareValue: req.test});
                }
            },
            {
                method: 'GET',
                path: '/test2',
                callback: (req, res) => {
                    console.log('CALLED /test2; req.test is', req.test);
                    res.json({middlewareValue: req.test});
                }
            }
        ]
    }
};
