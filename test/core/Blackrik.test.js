const Application = require('../../src/core/Blackrik');
const Blackrik = require('../../src/index');
const exampleInstance = require('../../examples/hello-world/config');
const CONSTANTS = require('../../src/core/Constants');

describe('Test _createReadModelStore', () => {
    test('Create store successfully', () => {
        const app = new Blackrik(exampleInstance);
        const testObj = new Application(app);
        testObj._createReadModelStore(CONSTANTS.DEFAULT_ADAPTER);
        const result = {
            default: {
                args: {
                    host: 'localhost',
                    database: 'readmodelstore',
                    user: 'root',
                    password: '1234',
                    timezone: 'Z'
                },
                isTransaction: false
            }
        };

        expect(testObj._stores).toEqual(result);
    });
    test('Create store - invalid adapter', () => {
        const app = new Blackrik(exampleInstance);
        const testObj = new Application(app);
        
        expect(() => testObj._createReadModelStore('bad adapter')).toThrow('ReadModel adapter \'bad adapter\' is invalid.');
    });
});

describe('Test _initStore', () => {
    test('Check for correct function call', () => {
        const app = new Blackrik(exampleInstance);
        const testObj = new Application(app);
        const mockFunction = {_createReadModelStore: jest.fn()};
        const spy = jest.spyOn(mockFunction, '_createReadModelStore');

        testObj._createReadModelStore = mockFunction._createReadModelStore;
        testObj._initStore();

        expect(spy).toHaveBeenCalled();
    });
});

describe('Test _initEventStore', () => {
    test('Initialise event store successfully', async () => {
        const app = new Blackrik(exampleInstance);
        const testObj = new Application(app);

        await testObj._initEventStore();
        expect(typeof testObj._eventStore.init).toBe('function');
    });
    // test('Initialise event store - throw error', async () => {
    // const copyInstance = JSON.parse(JSON.stringify(exampleInstance));
    // jest.mock('../../src/core/Adapter', () => {
    //     const mockAdapter = {
    //         create: jest.fn()
    //     };

    //     return mockAdapter;
    // });

    // const app = new Blackrik(exampleInstance);
    // const testObj = new Application(app);
    // testObj.config.eventStoreAdapter.module = {};

    // expect(async () => await testObj._initEventStore()).toThrow('EventStore adapter \'This is not a module\' is invalid.');
    // });
});
