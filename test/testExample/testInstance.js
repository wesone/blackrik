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
            name: 'users',
            projection: require('./readModels/users.projection'),
            resolvers: require('./readModels/users.resolvers'),
            adapter: 'default'
        }
    ],
    sagas: [
        {
            name: 'saga-users',
            source: require('./sagas/users'),
            adapter: 'default'
        }
    ],
    readModelStoreAdapters: {
        default: {
            args: {
                
            }
        }
    },
    eventStoreAdapter: {
        args: {
            host: 'localhost',
            database: 'eventStore',
            user: 'root',
            password: '1234'
        }
    },
    eventBusAdapter: {
        args: {
            brokers: ['localhost:9092']
        }
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
}
;
