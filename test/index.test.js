jest.mock('../src/core/Blackrik', () => {
    const init = jest.fn();
    const executeCommand = jest.fn();
    const scheduleCommand = jest.fn();
    const executeQuery = jest.fn();
    const deleteAggregate = jest.fn();
    const start = jest.fn();
    const stop = jest.fn();
    return jest.fn(() => {
        return {
            init,
            executeCommand,
            scheduleCommand,
            executeQuery,
            deleteAggregate,
            start,
            stop
        };
    });
});

const Blackrik = require('../src/index');
const _Blackrik = require('../src/core/Blackrik');
const exampleConfig = require('./_resources/testApp/config');

const defaultAdapters = require('../src/adapters');
const httpMethods = require('../src/resources/httpMethods');
const Errors = require('../src/core/Errors');

let instance;
let blackrik;
beforeEach(() => {
    jest.clearAllMocks();
    instance = new Blackrik(exampleConfig);
    blackrik = new _Blackrik(instance);
});
describe('Blackrik', () => {
    describe('has static properties', () => {
        test('ADAPTERS', () => {
            expect(Blackrik.ADAPTERS).toBe(defaultAdapters);
        });
        test('HTTP_METHODS', () => {
            expect(Blackrik.HTTP_METHODS).toBe(httpMethods);
        });
        test('ERRORS', () => {
            expect(Blackrik.ERRORS).toBe(Errors);
        });
    });

    describe('encapsules functions', () => {
        test('executeCommand', async () => {
            const params = [{}, 'invalid'];
            const expectedParams = params.slice(0, 1);

            await instance.executeCommand(...params);

            expect(blackrik.executeCommand).toHaveBeenCalledWith(...expectedParams);
        });
        test('scheduleCommand', async () => {
            const params = [0, {}, 'invalid'];
            const expectedParams = params.slice(0, 2);

            await instance.scheduleCommand(...params);

            expect(blackrik.scheduleCommand).toHaveBeenCalledWith(...expectedParams);
        });
        test('executeQuery', async () => {
            const params = ['', '', {}, 'invalid'];
            const expectedParams = params.slice(0, 3);

            await instance.executeQuery(...params);
        
            expect(blackrik.executeQuery).toHaveBeenCalledWith(...expectedParams);
        });
        describe('deleteAggregate', () => {
            test('encapsuled', async () => {
                const params = ['', '', {}, 'invalid'];
                const expectedParams = params.slice(0, 3);

                await instance.deleteAggregate(...params);

                expect(blackrik.deleteAggregate).toHaveBeenCalledWith(...expectedParams);
            });
            test('optional argument', async () => {
                const params = ['', ''];
                const expectedParams = params.concat(null);

                await instance.deleteAggregate(...params);
                
                expect(blackrik.deleteAggregate).toHaveBeenCalledWith(...expectedParams);
            });
        });

        describe('start', () => {
            test('initial start', async () => {
                await instance.start();
                
                expect(blackrik.start).toHaveBeenCalledTimes(1);
            });
            test('prevents double execution if already started', async () => {
                await instance.start();
                await instance.start();

                expect(blackrik.start).toHaveBeenCalledTimes(1);
            });
        });

        describe('stop', () => {
            test('stop while not running', async () => {
                await instance.stop();
                
                expect(blackrik.stop).not.toHaveBeenCalled();
            });
            test('stop while running', async () => {
                await instance.start();
                await instance.stop();
                await instance.stop();
        
                expect(blackrik.stop).toHaveBeenCalledTimes(1);
            });
        });
    });
});
