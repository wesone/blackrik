const Application = require('../../src/core/Blackrik');
const Blackrik = require('../../src/index');
const exampleInstance = require('../../examples/hello-world/config');

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
        })};
});
jest.mock('../../src/core/EventHandler.js', () => {
    return {
        init: jest.fn()
    };
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

// describe('Test _initEventHandler', () => {
//     test('Create handler successfully', async () => {
//         await testObj._initEventHandler();
//         const initSpy = jest.spyOn(testObj._eventStore, 'init');

//         expect(initSpy).toHaveBeenCalled();
//         expect(typeof testObj._eventHandler.init).toBe('function');
//     });
// });
