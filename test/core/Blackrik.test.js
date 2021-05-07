const Application = require('../../src/core/Blackrik');
const Blackrik = require('../../src/index');
const exampleInstance = require('../testExample/config');
const CONSTANTS = require('../../src/core/Constants');
// const CommandHandler = require('../../src/core/CommandHandler');
// const QueryHandler = require('../../src/core/QueryHandler');
// const CommandScheduler = require('../../src/core/CommandScheduler');

jest.mock('../../src/core/Adapter', () => {
    return {
        create: jest.fn(adapterName => {
            if(adapterName === 'bad adapter')
            {
                return false;
            }
            return {
                init: jest.fn()
            };
        })
    };
});

jest.mock('../../src/core/EventHandler', () => {
    return jest.fn(() => {
        return {
            init: jest.fn(),
            subscribe: jest.fn(),
            start: jest.fn(),
            replayEvents: jest.fn()
        };
    });
});

jest.mock('../../src/core/ReadModelStore', () => {
    const init = jest.fn()
        .mockReturnValueOnce(false)
        .mockReturnValue('Test string');
    return jest.fn(arg => {
        if(arg === 'return false')
            return {init: jest.fn(() => false)};
        return {init};
    });
});

jest.mock('../../src/core/workflow/index', () => {
    return jest.fn(() => {
        return {
            connect: jest.fn(() =>
                ({handlers: 'handlers', sideEffects: 'sideEffects'})
            )
        };
    });
});

// jest.mock('../../src/core/Workflow/index', () => {
//     return jest.fn(() => {
//         return {
//             connect: jest.fn()
//         };
//     });
// });

// jest.mock('../../src/core/CommandHandler');

// jest.mock('../../src/core/QueryHandler');

jest.mock('../../src/core/CommandScheduler', () => {
    const init = jest.fn();
    return jest.fn(() => {
        return {
            init,
        };
    });
});

jest.mock('../../src/core/Server', () => {
    const req = {};
    const next = jest.fn(() => true);

    const use = jest.fn(callback => {
        if(typeof callback === 'function')
            callback(req, 'test', next);
    });
    const post = jest.fn();
    const get = jest.fn();
    const start = jest.fn();
    const route = jest.fn(() => {
        return {
            post,
            get,
        };
    });
    return jest.fn(() => {
        return {
            init: jest.fn(),
            use,
            get,
            route,
            start
        };
    });
});


let app;
let testObj;
beforeEach(() => {
    app = new Blackrik(exampleInstance);
    testObj = new Application(app);
});

describe('Test _createReadModelStore', () => {
    // test('Create store successfully', () => {
    //     const result = testObj._createReadModelStore('Test adapter name');
    //     expect(typeof result['init']).toBe('function');
    // });
    test('Create store - invalid adapter', () => {
        const adapterName = 'bad adapter';
        testObj.config.readModelStoreAdapters[adapterName] = adapterName;
        
        expect(() => testObj._createReadModelStore(adapterName)).toThrow(`ReadModel adapter '${adapterName}' is invalid.`);
    });
});

describe('Test _initStore', () => {
    test('Check for correct function call - default adpater', () => {
        testObj.config.adapter = undefined;
        const mockFunction = {_createReadModelStore: jest.fn()};
        const spy = jest.spyOn(mockFunction, '_createReadModelStore');

        testObj._createReadModelStore = mockFunction._createReadModelStore;
        testObj._initStore();

        expect(spy).toHaveBeenCalled();
    });
});

describe('Test _initEventStore', () => {
    // test('Initialise event store successfully', async () => {
    //     await testObj._initEventStore();
    //     const initSpy = jest.spyOn(testObj._eventStore, 'init');

    //     expect(typeof testObj._eventStore.init).toBe('function');
    //     expect(initSpy).toHaveBeenCalled();
    // });
    test('Initialise event store - throw error', async () => {
        testObj.config.eventStoreAdapter = 'bad adapter';
        try 
        {
            await testObj._initEventStore();
        } 
        catch(error)
        {
            expect(error.message).toBe('EventStore adapter \'undefined\' is invalid.');
        }
    });
});

describe('Test _initEventHandler', () => {
    // test('Create handler successfully', async () => {
    //     await testObj._initEventHandler();
    //     const initSpyEventHandler = jest.spyOn(testObj._eventHandler, 'init');

    //     expect(initSpyEventHandler).toHaveBeenCalled();
    //     expect(typeof testObj._eventHandler.init).toBe('function');
    // });
    
    test('Create handler - invalid eventbus adapter', async () => {
        const Adapter = require('../../src/core/Adapter.js');
        const adapterCreate = Adapter.create;
        Adapter.create = jest.fn(() => undefined);
        try
        {
            await testObj._initEventHandler();
        } 
        catch(error)
        {
            expect(error.message).toBe(`EventBus adapter '${testObj.config.eventBusAdapter.module || 'default'}' is invalid.`);
        }
        Adapter.create = adapterCreate;
    });
});

describe('Test _createSubscriptions', () => {
    test('Call callback', async () => {
        const eventMap = {
            init: jest.fn(),
            'USER_CREATED': jest.fn(),
            'USER_UPDATED': jest.fn(),
            'USER_REJECTED': jest.fn(),
        };
        const testReturn = 'testReturn';
        const store = {createProxy: jest.fn(() => testReturn), config: 'test config'};
        const callback = jest.fn();
        testObj._eventHandler = {subscribe: jest.fn((name, eventType, callback) => {
            callback();
        })};

        const spyCreateProxy = jest.spyOn(store, 'createProxy');

        await testObj._createSubscriptions('user', eventMap, store, callback);
        expect(spyCreateProxy).toHaveBeenCalled();
        expect(callback).toHaveBeenCalledWith(eventMap['USER_CREATED'], testReturn, undefined, store.config);
    });
});

describe('Test _registerSubscribers', () => {
    test('Register subscribers successfully - no init in readmodelstore', async () => {
        const callback = jest.fn();
        const adapter = 'default';
        const handlers = {
            init: jest.fn(),
            'USER_CREATED': jest.fn(),
            'USER_UPDATED': jest.fn(),
            'USER_REJECTED': jest.fn(),
        };
        testObj._createSubscriptions = jest.fn();
        testObj._createReadModelStore = jest.fn();
        const spyCreateSubscriptions = jest.spyOn(testObj, '_createSubscriptions');
        const spyCreateReadModelStore = jest.spyOn(testObj, '_createReadModelStore');

        const expected = {handlers, adapter};
        const result = await testObj._registerSubscribers('name', handlers, adapter, callback);

        expect(spyCreateSubscriptions).toHaveBeenCalled();
        expect(spyCreateReadModelStore).toHaveBeenCalled();
        expect(result).toEqual(expected);        
    });
    test('Register subscribers successfully - no adapter', async () => {
        const callback = jest.fn();
        const adapter = undefined;
        const handlers = {
            init: jest.fn(),
            'USER_CREATED': jest.fn(),
            'USER_UPDATED': jest.fn(),
            'USER_REJECTED': jest.fn(),
        };
        testObj._createSubscriptions = jest.fn();
        testObj._createReadModelStore = jest.fn();
        const spyCreateSubscriptions = jest.spyOn(testObj, '_createSubscriptions');
        const spyCreateReadModelStore = jest.spyOn(testObj, '_createReadModelStore');

        const expected = {handlers, adapter: 'default'};
        const result = await testObj._registerSubscribers('name', handlers, adapter, callback);

        expect(spyCreateSubscriptions).toHaveBeenCalled();
        expect(spyCreateReadModelStore).toHaveBeenCalled();
        expect(result).toEqual(expected);
    });
});

describe('Test _processReadModels', () => {
    test('Process read-models', async () => {
        const {resolvers, adapter} = testObj.config.readModels[0];
        testObj._registerSubscribers = jest.fn(() => new Promise(resolve => resolve({adapter})));
        const spyRegisterSubscribers = jest.spyOn(testObj, '_registerSubscribers');

        const result = await testObj._processReadModels();
        const expected = [{handlers: resolvers, adapter}];
        const expectedResolvers = {user: {handlers: resolvers, adapter}};
        expect(spyRegisterSubscribers).toHaveBeenCalled();
        expect(result).toEqual(expected);
        expect(testObj._resolvers).toEqual(expectedResolvers);
    });
    test('Call callback', async () => {
        const handler = jest.fn();
        testObj._registerSubscribers = jest.fn(async (name, projection, adapter, callback) => {
            await callback(handler);
            return new Promise(resolve => resolve({adapter}));
        });

        await testObj._processReadModels();
        expect(handler).toHaveBeenCalled();
    });
});

describe('Test _getSideEffectsProxy', () => {
    test('Return function with undefined as return', () => {
        const sideEffects = { sendRegistrationMail: jest.fn() };
        const event = {isReplay: true};
    
        const result = testObj._getSideEffectsProxy(sideEffects, event, testObj.config.sagas[0].source.handlers).sendRegistrationMail();
    
        expect(result).toEqual(undefined);
    });
    test('Bind function', async () => {
        const sideEffects = { sendRegistrationMail: jest.fn(() => 'testarg'), executeCommand: jest.fn() };
        const event = {isReplay: false};
        const mockExecuteCommand = jest.fn();
        testObj.executeCommand = mockExecuteCommand;
        const spyExecuteCommand = jest.spyOn(testObj, 'executeCommand');
    
        const result = testObj._getSideEffectsProxy(sideEffects, event, testObj.config.sagas[0].source.handlers);
        result.executeCommand();

        expect(spyExecuteCommand).toHaveBeenCalled();
        expect(typeof result.sendRegistrationMail).toEqual('function');
    });
});

describe('Test _processSagas', () => {
    test('Check for correct function call', async () => {
        const {name, adapter} = testObj.config.sagas[0];
        testObj._registerSubscribers = jest.fn();
        await testObj._processSagas();

        expect(testObj._registerSubscribers).toHaveBeenCalledWith(name, expect.anything(), adapter, expect.anything()
        );
    });
    test('Handlers and side effects from workflow', async () => {
        testObj.config.sagas[0].source.initial = 'defined';
        const {name, adapter} = testObj.config.sagas[0];
        testObj._registerSubscribers = jest.fn();
        await testObj._processSagas();

        expect(testObj._registerSubscribers).toHaveBeenCalledWith(name, expect.anything(), adapter, expect.anything());
    });
    test('Call callback', async () => {
        const handler = jest.fn();
        testObj._getSideEffectsProxy = jest.fn();
        testObj._registerSubscribers = jest.fn(async (name, handlers, adapter, callback) => { 
            await callback(handler);
        });

        await testObj._processSagas();
        expect(handler).toHaveBeenCalled();
    });
});

// describe('Test _processSubscribers', () => {
//     test('Check for function calls', () => {
//         const mockProcessReadModels = jest.fn();
//         const mockProcessSagas = jest.fn();
        
//         testObj._processReadModels = mockProcessReadModels;
//         testObj._processSagas = mockProcessSagas;
//         const spyProcessReadModels = jest.spyOn(testObj, '_processReadModels');
//         const spyProcessSagas = jest.spyOn(testObj, '_processSagas');

//         testObj._processSubscribers();
//         expect(spyProcessReadModels).toHaveBeenCalled();
//         expect(spyProcessSagas).toHaveBeenCalled();
//     });
// });

// describe('Test _initHandlers', () => {
//     test('Check for function calls', async () => {
//         await testObj._initHandlers();
//         expect(CommandHandler).toHaveBeenCalledWith(testObj);
//         expect(QueryHandler).toHaveBeenCalledWith(testObj);
//         expect(CommandScheduler).toHaveBeenCalled();

//         const spyInit = jest.spyOn(new CommandScheduler, 'init');
//         expect(spyInit).toHaveBeenCalled();
//     });
// });

// describe('Test _processMiddlewares', () => {
//     test('Check for correct function calls', () => {
//         const mockRegisterInternalMiddlewares = jest.fn();
//         const mockRegisterMiddlewares = jest.fn();

//         testObj._registerInternalMiddlewares = mockRegisterInternalMiddlewares;
//         testObj._registerMiddlewares = mockRegisterMiddlewares;

//         const spyMockInternalMiddlewares = jest.spyOn(testObj, '_registerInternalMiddlewares');
//         const spyMockRegisterMiddlewares = jest.spyOn(testObj, '_registerMiddlewares'); 

//         testObj._processMiddlewares();

//         expect(spyMockInternalMiddlewares).toHaveBeenCalled();
//         expect(spyMockRegisterMiddlewares).toHaveBeenCalled();
//     });
// });

describe('Test buildContext', () => {
    test('Return empty object', () => {
        testObj.config.contextProvider = jest.fn();
        const result = testObj.buildContext();
        expect(result).toEqual({});
    });
});

describe('Test _registerAPI', () => {
    test('Method not included', async () => {
        const testMethod = 'not included';
        testObj.config.server.routes.push({method: testMethod});
        
        try 
        {
            await testObj.start();
        } 
        catch(error)
        {
            expect(error.message).toBe(`Method '${testMethod.toUpperCase()}' is invalid.`);
        }
    });
    test('Path starts without / - add / to path', async () => {
        const Server = require('../../src/core/Server');
        const testServer = Server();
        const testString = 'testString';
        testObj.config.server.routes[0].path = testString;
        
        await testObj.start();
        expect(testServer.route).toHaveBeenCalledWith('/' + testString);
    });
});

describe('Test executeCommand', () => {
    test('Without causationevent ', async () => {
        testObj._commandHandler = {process: jest.fn()};
        const testCommand = 'test';
        
        const result = await testObj.executeCommand(testCommand);
        expect(result).toBe(false);
    });
    test('With causationEvent', async () => {
        testObj._commandHandler = {process: jest.fn()};
        const testCommand = 'test';
        const testCausationEvent = 'causation test';
        
        const result = await testObj.executeCommand(testCommand, testCausationEvent);
        expect(result).toBe(false);
    });
});

describe('Test scheduleCommand', () => {
    test('Call process', async () => {
        testObj._commandScheduler = {process: jest.fn()};

        const result = await testObj.scheduleCommand();
        expect(result).toBe(false);
    });
});

describe('Test executeQuery', () => {
    test('Call process', async () => {
        testObj._queryHandler = {process: jest.fn(() => 'test')};
        const spyBuildContext = jest.spyOn(testObj, 'buildContext');

        const result = await testObj.executeQuery();
        expect(result).toBe('test');
        expect(spyBuildContext).toHaveBeenCalled();
    });
});

describe('Test start()', () => {
    test('Successful start', async () => {    
        const spyCreateReadModelStore = jest.spyOn(testObj, '_createReadModelStore');
        const spyRegisterSubscribers = jest.spyOn(testObj, '_registerSubscribers');
        
        const result = await testObj.start();
        
        // _initStore
        expect(spyCreateReadModelStore).toHaveBeenCalledWith('default');
        // _initEventStore
        expect(typeof testObj._eventStore.init).toBe('function');
        // _initEventHandler
        expect(typeof testObj._eventHandler.init).toBe('function');
        const spyEventHandlerStart = jest.spyOn(testObj._eventHandler, 'start');
        // _processAggregates
        expect(testObj._aggregates).not.toBe(undefined);
        // _processSubscribers - more detailed tests available 
        expect(spyRegisterSubscribers).toHaveBeenCalled();
        // this._eventHandler.start()
        expect(spyEventHandlerStart).toHaveBeenCalled();
        // _initHandlers
        const spyCommandScheduler = jest.spyOn(testObj._commandScheduler, 'init');
        expect(spyCommandScheduler).toHaveBeenCalled();
        expect(testObj._commandHandler).not.toBe(undefined);
        expect(testObj._queryHandler).not.toBe(undefined);
        expect(testObj._commandScheduler).not.toBe(undefined);
        // replay events
        const expectedReplayCall = [
            [ 'user', [ 'USER_CREATED', 'USER_UPDATED', 'USER_REJECTED' ] ],
            [ 'user', [ 'USER_CREATED' ] ]
        ];
        expect(testObj._eventHandler.replayEvents).toHaveBeenCalledWith(expectedReplayCall);
        // new Server
        const Server = require('../../src/core/Server');
        expect(Server).toHaveBeenCalled();
        // _processMiddlewares
        const testServer = Server();
        expect(testServer.use).toHaveBeenCalled();
        // _registerInternalAPI
        expect(testServer.route).toHaveBeenCalledWith(CONSTANTS.ROUTE_COMMAND);
        expect(testServer.route).toHaveBeenCalledWith(CONSTANTS.ROUTE_QUERY);
        expect(testServer.route().post).toHaveBeenCalled();
        expect(testServer.route().get).toHaveBeenCalled();
        // _registerErrorHandlingMiddlewares
        // #server.start
        expect(testServer.start).toHaveBeenCalled();
        // return
        expect(result).not.toBe(undefined);
    });
    test('Start with no replay events', async () => {
        testObj._createReadModelStore = jest.fn(() => 'return false');
        await testObj.start();
    });
});
