const Blackrik = require('../../src/index');
const _Blackrik = require('../../src/core/Blackrik');
const exampleConfig = require('../_resources/testApp/config');
const CONSTANTS = require('../../src/core/Constants');

jest.mock('../../src/core/Adapter', () => {
    return {
        create: jest.fn(adapterName => {
            if(adapterName === 'bad adapter')
            {
                return null;
            }
            return {
                init: jest.fn(),
                close: jest.fn()
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
            stop: jest.fn(),
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

jest.mock('../../src/core/CommandScheduler', () => {
    const init = jest.fn();
    return jest.fn(() => {
        return {
            init,
        };
    });
});

const serverMock = {};
jest.mock('../../src/core/Server', () => {
    const req = {};
    const next = jest.fn(() => true);

    const use = jest.fn(callback => {
        if(typeof callback === 'function')
            callback(req, 'test', next);
    });
    const post = jest.fn();
    const get = jest.fn();
    const route = jest.fn(() => {
        return {
            post,
            get,
        };
    });
    serverMock.start = jest.fn();
    serverMock.stop = jest.fn();
    return jest.fn(() => {
        return {
            init: jest.fn(),
            use,
            get,
            route,
            start: serverMock.start,
            stop: serverMock.stop
        };
    });
});


let instance;
let blackrik;
beforeEach(() => {
    jest.clearAllMocks();
    instance = new Blackrik(exampleConfig);
    blackrik = new _Blackrik(instance);
});

describe('Test _createReadModelStore', () => {
    test('Create store - invalid adapter', () => {
        const adapterName = 'bad adapter';
        blackrik.config.readModelStoreAdapters[adapterName] = adapterName;
        
        expect(() => blackrik._createReadModelStore(adapterName)).toThrow(`ReadModel adapter '${adapterName}' is invalid.`);
    });
});

describe('Test _initStore', () => {
    test('Check for correct function call - default adpater', () => {
        blackrik.config.adapter = undefined;
        const mockFunction = {_createReadModelStore: jest.fn()};
        const spy = jest.spyOn(mockFunction, '_createReadModelStore');

        blackrik._createReadModelStore = mockFunction._createReadModelStore;
        blackrik._initStore();

        expect(spy).toHaveBeenCalled();
    });
});

describe('Test _initEventStore', () => {
    test('Initialise event store - throw error', async () => {
        blackrik.config.eventStoreAdapter = 'bad adapter';
        await expect(blackrik._initEventStore()).rejects.toThrow();
    });
});

describe('Test _initEventHandler', () => {
    test('Create handler - invalid eventbus adapter', async () => {
        const Adapter = require('../../src/core/Adapter.js');
        const adapterCreate = Adapter.create;
        Adapter.create = jest.fn(() => undefined);
        try
        {
            await blackrik._initEventHandler();
        } 
        catch(error)
        {
            expect(error.message).toBe(`EventBus adapter '${blackrik.config.eventBusAdapter.module || 'default'}' is invalid.`);
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
        blackrik._eventHandler = {
            subscribe: jest.fn((name, eventType, callback) => {
                callback();
            })
        };

        const spyCreateProxy = jest.spyOn(store, 'createProxy');

        await blackrik._createSubscriptions('user', eventMap, store, callback);
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
        blackrik._createSubscriptions = jest.fn();
        blackrik._createReadModelStore = jest.fn();
        const spyCreateSubscriptions = jest.spyOn(blackrik, '_createSubscriptions');
        const spyCreateReadModelStore = jest.spyOn(blackrik, '_createReadModelStore');

        const expected = {handlers, adapter};
        const result = await blackrik._registerSubscribers('name', handlers, adapter, callback);

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
        blackrik._createSubscriptions = jest.fn();
        blackrik._createReadModelStore = jest.fn();
        const spyCreateSubscriptions = jest.spyOn(blackrik, '_createSubscriptions');
        const spyCreateReadModelStore = jest.spyOn(blackrik, '_createReadModelStore');

        const expected = {handlers, adapter: 'default'};
        const result = await blackrik._registerSubscribers('name', handlers, adapter, callback);

        expect(spyCreateSubscriptions).toHaveBeenCalled();
        expect(spyCreateReadModelStore).toHaveBeenCalled();
        expect(result).toEqual(expected);
    });
});

describe('Test _processReadModels', () => {
    test('Process read-models', async () => {
        const {resolvers, adapter} = blackrik.config.readModels[0];
        blackrik._registerSubscribers = jest.fn(() => new Promise(resolve => resolve({adapter})));
        const spyRegisterSubscribers = jest.spyOn(blackrik, '_registerSubscribers');

        const result = await blackrik._processReadModels();
        const expected = [{handlers: resolvers, adapter}];
        const expectedResolvers = {user: {handlers: resolvers, adapter}};
        expect(spyRegisterSubscribers).toHaveBeenCalled();
        expect(result).toEqual(expected);
        expect(blackrik._resolvers).toEqual(expectedResolvers);
    });
    test('Call callback', async () => {
        const handler = jest.fn();
        blackrik._registerSubscribers = jest.fn(async (name, projection, adapter, callback) => {
            await callback(handler);
            return new Promise(resolve => resolve({adapter}));
        });

        await blackrik._processReadModels();
        expect(handler).toHaveBeenCalled();
    });
});

describe('Test _getSideEffectsProxy', () => {
    test('Return function with undefined as return', () => {
        const sideEffects = {sendRegistrationMail: jest.fn()};
        const event = {isReplay: true};
    
        const result = blackrik._getSideEffectsProxy(sideEffects, event, blackrik.config.sagas[0].source.handlers).sendRegistrationMail();
    
        expect(result).toEqual(undefined);
    });
    test('Bind function', async () => {
        const sideEffects = {sendRegistrationMail: jest.fn(() => 'testarg'), executeCommand: jest.fn()};
        const event = {isReplay: false};
        const mockExecuteCommand = jest.fn();
        blackrik.executeCommand = mockExecuteCommand;
        const spyExecuteCommand = jest.spyOn(blackrik, 'executeCommand');
    
        const result = blackrik._getSideEffectsProxy(sideEffects, event, blackrik.config.sagas[0].source.handlers);
        result.executeCommand();

        expect(spyExecuteCommand).toHaveBeenCalled();
        expect(typeof result.sendRegistrationMail).toEqual('function');
    });
});

describe('Test _processSagas', () => {
    test('Check for correct function call', async () => {
        const {name, adapter} = blackrik.config.sagas[0];
        blackrik._registerSubscribers = jest.fn();
        await blackrik._processSagas();

        expect(blackrik._registerSubscribers).toHaveBeenCalledWith(name, expect.anything(), adapter, expect.anything()
        );
    });
    test('Handlers and side effects from workflow', async () => {
        blackrik.config.sagas[0].source.initial = 'defined';
        const {name, adapter} = blackrik.config.sagas[0];
        blackrik._registerSubscribers = jest.fn();
        await blackrik._processSagas();

        expect(blackrik._registerSubscribers).toHaveBeenCalledWith(name, expect.anything(), adapter, expect.anything());
    });
    test('Call callback', async () => {
        const handler = jest.fn();
        blackrik._getSideEffectsProxy = jest.fn();
        blackrik._registerSubscribers = jest.fn(async (name, handlers, adapter, callback) => { 
            await callback(handler);
        });

        await blackrik._processSagas();
        expect(handler).toHaveBeenCalled();
    });
});

test('buildContext returns empty object as default', () => {
    blackrik.config.contextProvider = jest.fn();
    expect(blackrik.buildContext()).toStrictEqual({});
});

describe('Test _registerAPI', () => {
    test('checks if method is allowed', async () => {
        const method = 'invalid';
        blackrik.config.server.routes.push({method});
        
        await expect(blackrik.start()).rejects.toThrow();
    });
    test('prepends \'/\' to path if path does not start with \'/\'', async () => {
        const Server = require('../../src/core/Server');
        const testServer = Server();
        const testString = 'testString';
        blackrik.config.server.routes[0].path = testString;
        
        await blackrik.start();
        expect(testServer.route).toHaveBeenCalledWith('/' + testString);
    });
});

describe('Test executeCommand', () => {
    test('without causation event ', async () => {
        blackrik._commandHandler = {process: jest.fn()};
        const testCommand = 'test';
        
        const result = await blackrik.executeCommand(testCommand);
        expect(result).toBe(false);
    });
    test('with causation event', async () => {
        blackrik._commandHandler = {process: jest.fn()};
        const testCommand = 'test';
        const testCausationEvent = 'causation test';
        
        const result = await blackrik.executeCommand(testCommand, testCausationEvent);
        expect(result).toBe(false);
    });
});

describe('Test scheduleCommand', () => {
    test('Call process', async () => {
        blackrik._commandScheduler = {process: jest.fn()};

        const result = await blackrik.scheduleCommand();
        expect(result).toBe(false);
    });
});

describe('Test executeQuery', () => {
    test('Call process', async () => {
        blackrik._queryHandler = {process: jest.fn(() => 'test')};
        const spyBuildContext = jest.spyOn(blackrik, 'buildContext');

        const result = await blackrik.executeQuery();
        expect(result).toBe('test');
        expect(spyBuildContext).toHaveBeenCalled();
    });
});

test('deleteAggregate forwards call to _commandHandler', async () => {
    blackrik._commandHandler = {deleteAggregate: jest.fn(() => true)};

    await blackrik.deleteAggregate('', '');
    expect(blackrik._commandHandler.deleteAggregate).toHaveBeenCalledWith('', '', null, null);
});

describe('Test start()', () => {
    test('successful start', async () => {    
        const spyCreateReadModelStore = jest.spyOn(blackrik, '_createReadModelStore');
        const spyRegisterSubscribers = jest.spyOn(blackrik, '_registerSubscribers');
        
        const result = await blackrik.start();
        
        // _initStore
        expect(spyCreateReadModelStore).toHaveBeenCalledWith('default');
        // _initEventStore
        expect(typeof blackrik._eventStore.init).toBe('function');
        // _initEventHandler
        expect(typeof blackrik._eventHandler.init).toBe('function');
        const spyEventHandlerStart = jest.spyOn(blackrik._eventHandler, 'start');
        // _processAggregates
        expect(blackrik._aggregates).not.toBe(undefined);
        // _processSubscribers - more detailed tests available 
        expect(spyRegisterSubscribers).toHaveBeenCalled();
        // this._eventHandler.start()
        expect(spyEventHandlerStart).toHaveBeenCalled();
        // _initHandlers
        const spyCommandScheduler = jest.spyOn(blackrik._commandScheduler, 'init');
        expect(spyCommandScheduler).toHaveBeenCalled();
        expect(blackrik._commandHandler).not.toBe(undefined);
        expect(blackrik._queryHandler).not.toBe(undefined);
        expect(blackrik._commandScheduler).not.toBe(undefined);
        // replay events
        const expectedReplayCall = [
            ['user', ['USER_CREATED', 'USER_UPDATED', 'USER_REJECTED']]
        ];
        expect(blackrik._eventHandler.replayEvents).toHaveBeenCalledWith(expectedReplayCall);
        // new Server
        const Server = require('../../src/core/Server');
        expect(Server).toHaveBeenCalled();
        // _processMiddlewares
        const testServer = Server();
        expect(testServer.use).toHaveBeenCalled();
        // _registerInternalAPI
        Object.values(CONSTANTS.ROUTES).forEach(route => expect(testServer.route).toHaveBeenCalledWith(route));
        expect(testServer.route().post).toHaveBeenCalled();
        expect(testServer.route().get).toHaveBeenCalled();
        // _registerErrorHandlingMiddlewares
        // #server.start
        expect(testServer.start).toHaveBeenCalled();
        // return
        expect(result).not.toBe(undefined);
    });
    test('start with no replay events', async () => {
        blackrik._createReadModelStore = jest.fn(() => 'return false');
        await blackrik.start();
    });
});

test('stop a running application', async () => {
    await blackrik.start();
    await blackrik.stop();
    
    expect(serverMock.stop).toHaveBeenCalled();
    expect(blackrik._eventHandler.stop).toHaveBeenCalled();
    expect(blackrik._eventStore.close).toHaveBeenCalled();
});
