const Blackrik = require('../../');

blackrik = new Blackrik({
    aggregates: [
        {
            name: 'user',
            commands: {
                create: async (command, state, context) => {
                    console.log('EXEC create on user', state, command, context);
                    return {
                        type: 'USER_CREATED',
                        correlationId: '0',
                        causationId: '0',
                        payload: {}
                    };
                }
            },
            projection: {
                default: () => ({}),
                'USER_CREATED': (state, event) => ({
                    ...state
                })
            }
        }
    ],
    readModels: [

    ],
    sagas: [

    ],
    server: {
        port: 3000,
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
});
