const Blackrik = require('../../');

(async () => {
    blackrik = await (new Blackrik({
        aggregates: [
            {
                name: 'user',
                commands: {
                    create: async (command, state, context) => {
                        return {
                            type: 'USER_CREATED',
                            correlationId: '0',
                            causationId: '0',
                            payload: {}
                        };
                    }
                },
                projection: {
                    init: () => ({}),
                    'USER_CREATED': (state, event) => ({
                        ...state
                    }),
                    'USER_UPDATED': (state, {payload}) => ({
                        ...state,
                        ...payload
                    })
                }
            }
        ],
        readModels: [
            {
                name: 'users',
                projection: {
                    init: store => {},
                    'USER_CREATED': async (store, event) => {
                        console.log('ReadModel projection executed', event);
                    }
                },
                resolvers: {
                    get: async (store, args) => {
                        return {
                            test: 42
                        };
                    }
                },
                adapter: 'default'
            }
        ],
        sagas: [
            {
                name: 'saga-user',
                source: {
                    init: store => {},
                    'USER_CREATED': async (store, event) => {
                        console.log('Saga executed', event);
                    }
                },
                adapter: 'default'
            }
        ],
        readModelStoreAdapters: {},
        eventStoreAdapter: {},
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
                },
                {
                    // this route should not get called as /commands is reserved
                    method: 'POST',
                    path: '/commands',
                    callback: (req, res) => {
                        console.log('CALLED /commands');
                    }
                }
            ]
        }
    })).start();
})();
