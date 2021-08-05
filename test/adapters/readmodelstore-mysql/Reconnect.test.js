import Adapter from '../../../src/adapters/readmodelstore-mysql/Adapter';
let errorCallback;
jest.mock('mysql2/promise', () => {
    const mockConnect = jest.fn();
    const mockExecute = jest.fn();
    const mockEnd = jest.fn();
    const mockOn = jest.fn((name, cb) => {
        if(name === 'error')
            errorCallback = cb;
    });

    const object = { // Object to spy on
        mockConnect, mockExecute
    };
    const mockCreateConnection = jest.fn(() => {
        return {
            connect: object.mockConnect,
            execute: object.mockExecute, // does not get executed in init() but still needed for a bind
            end: mockEnd,
            on: mockOn
        };
    });
    return {
        createConnection: () => Promise.resolve((mockCreateConnection()))
    };
});

const testConfig = {
    host: 'localhost',
    database: 'eventstore',
    user: 'root',
    password: '1234'
};

test('Throw error and reconnect', async () => {
    const testObj = new Adapter(testConfig);
    const error = new Error('test error');
    error.fatal = true;
    const mockConnection = {execute: jest.fn(() => {throw error;})};
    testObj.connection = mockConnection;

    try 
    {
        await testObj.find('test', {id: 1});
    } 
    catch(error)
    {
        expect(error).not.toBe(undefined);            
    }
    
    const spyExecute = jest.spyOn(mockConnection, 'execute');
    expect(spyExecute).toHaveBeenCalled();

    expect(testObj.connection).toBe(null);

});


test('Reconnect on connection loss', async () => {
    const error = new Error('test error');
    error.fatal = true;
    errorCallback = null;
    const testObj = new Adapter(testConfig);
    
    await testObj.connect();

    expect(errorCallback).not.toBe(null);
    const originalError = console.error;
    console.error = jest.fn();
    
    errorCallback(error);
    expect(console.error).toHaveBeenCalled();
    console.error = originalError;
});


test('Reconnect on execute', async () => {
    const testObj = new Adapter(testConfig);

    testObj.connect = jest.fn(() => testObj.connection = { execute: jest.fn()});
    testObj.connection = null;

    await testObj.findOne('test', {id: 1});

    expect(testObj.connection).not.toBe(null);

});
