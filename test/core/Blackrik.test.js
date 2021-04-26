const Application = require('../../src/core/Blackrik');
const Blackrik = require('../../src/index');
const exampleInstance = require('../../examples/hello-world/config');
const CommandHandler = require('../../src/core/CommandHandler.js');
const QueryHandler = require('../../src/core/QueryHandler');
const CommandScheduler = require('../../src/core/CommandScheduler');

jest.mock('../../src/core/Adapter.js', () => {
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
jest.mock('../../src/core/EventHandler.js', () => {
    return jest.fn(() => {
        return {
            init: jest.fn()
        };
    });
});

jest.mock('../../src/core/ReadModelStore.js', () => {
    return jest.fn(() => {
        return {
            init: jest.fn(() => 'Test string')
        };
    });
});

jest.mock('../../src/core/workflow/index.js', () => {
    return jest.fn(() => {
        return {
            connect: jest.fn()
        };
    });
});

jest.mock('../../src/core/CommandHandler.js');

jest.mock('../../src/core/QueryHandler.js');

jest.mock('../../src/core/CommandScheduler.js', () => {
    const init = jest.fn();
    return jest.fn(() => {
        return {
            init
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
    test('Create store successfully', () => {
        const result = testObj._createReadModelStore('Test adapter name');
        expect(typeof result['init']).toBe('function');
    });
    test('Create store - invalid adapter', () => {
        const adapterName = 'bad adapter';
        testObj.config.readModelStoreAdapters[adapterName] = adapterName;
        expect(() => testObj._createReadModelStore(adapterName)).toThrow(`ReadModel adapter '${adapterName}' is invalid.`);
    });
});

describe('Test _initStore', () => {
    test('Check for correct function call', () => {
        const mockFunction = {_createReadModelStore: jest.fn()};
        const spy = jest.spyOn(mockFunction, '_createReadModelStore');

        testObj._createReadModelStore = mockFunction._createReadModelStore;
        testObj._initStore();

        expect(spy).toHaveBeenCalled();
    });
});

describe('Test _initEventStore', () => {
    test('Initialise event store successfully', async () => {
        await testObj._initEventStore();
        const initSpy = jest.spyOn(testObj._eventStore, 'init');

        expect(typeof testObj._eventStore.init).toBe('function');
        expect(initSpy).toHaveBeenCalled();
    });
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
    test('Create handler successfully', async () => {
        await testObj._initEventHandler();
        const initSpyEventHandler = jest.spyOn(testObj._eventHandler, 'init');

        expect(initSpyEventHandler).toHaveBeenCalled();
        expect(typeof testObj._eventHandler.init).toBe('function');
    });
    test('Create handler - invalid eventbus adapter', async () => {
        const Adapter = require('../../src/core/Adapter.js');
        Adapter.create = jest.fn(() => undefined);
        try 
        {
            await testObj._initEventHandler();
        } 
        catch(error)
        {
            expect(error.message).toBe(`EventBus adapter '${testObj.config.eventBusAdapter.module}' is invalid.`);
        }
    });
});

describe('Test _registerSubscribers', () => {
    test('Register subscribers successfully', async () => {
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
        const mockExecuteCommand = jest.fn(() => 'nocie');
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
});

describe('Test _processSubscribers', () => {
    test('Check for function calls', () => {
        const mockProcessReadModels = jest.fn();
        const mockProcessSagas = jest.fn();
        
        testObj._processReadModels = mockProcessReadModels;
        testObj._processSagas = mockProcessSagas;
        const spyProcessReadModels = jest.spyOn(testObj, '_processReadModels');
        const spyProcessSagas = jest.spyOn(testObj, '_processSagas');

        testObj._processSubscribers();
        expect(spyProcessReadModels).toHaveBeenCalled();
        expect(spyProcessSagas).toHaveBeenCalled();
    });
});

describe('Test _initHandlers', () => {
    test('Check for function calls', async () => {
        await testObj._initHandlers();
        expect(CommandHandler).toHaveBeenCalledWith(testObj);
        expect(QueryHandler).toHaveBeenCalledWith(testObj);
        expect(CommandScheduler).toHaveBeenCalled();

        const spyInit = jest.spyOn(new CommandScheduler, 'init');
        expect(spyInit).toHaveBeenCalled();
    });
});
