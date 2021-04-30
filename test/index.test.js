const Blackrik = require('../src/index');
const Application = require('../src/core/Blackrik');
const exampleInstance = require('../examples/hello-world/config');

const defaultAdapters = Object.freeze(require('../src/adapters'));
const httpMethods = Object.freeze(require('../src/resources/httpMethods'));
const Errors = Object.freeze(require('../src/core/Errors'));

jest.mock('../src/core/Blackrik', () => {
    const testExecuteCommand = jest.fn();
    const testScheduleCommand = jest.fn();
    const testExecuteQuery = jest.fn();
    const start = jest.fn();
    return jest.fn(() => {
        return {
            init: jest.fn(() => 'Test string'),
            executeCommand: testExecuteCommand,
            scheduleCommand: testScheduleCommand,
            executeQuery: testExecuteQuery,
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
describe('Test static metods', () => {
    test('ADAPTERS', () => {
        const result = Blackrik.ADAPTERS;
        expect(result).toBe(defaultAdapters);
    });
    test('HTTP_METHODS', () => {
        const result = Blackrik.HTTP_METHODS;
        expect(result).toBe(httpMethods);
    });
    test('ERRORS', () => {
        const result = Blackrik.ERRORS;
        expect(result).toBe(Errors);
    });
});

describe('Test commands / query', () => {
    test('executeCommand', async () => {
        const testCommand = 'test';
        await app.executeCommand(testCommand);

        expect(testObj.executeCommand).toHaveBeenCalledWith(testCommand);
    });
    test('scheduleCommand', async () => {
        const timestamp = 4224;
        const testCommand = 'test';

        await app.scheduleCommand(timestamp, testCommand);
        expect(testObj.scheduleCommand).toHaveBeenCalledWith(timestamp, testCommand);
    });
    test('executeQuery', async () => {
        app.executeQuery();
    
        expect(app.executeQuery).toHaveBeenCalled();
    });
});

describe('Test start', () => {
    test('Start sucessfull - process not yet started', async () => {
        await app.start();
        
        expect(testObj.start).toHaveBeenCalled();
    });
    // test('Start sucessfull - already started', async () => {
    //     app.#started = true
    //     await app.start();
        
    //     expect(testObj.start).toHaveBeenCalled();
    // });
});
