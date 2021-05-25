const ReadModelStore = require('../../src/core/ReadModelStore');
const {READMODEL_INIT_FUNCTION} = require('../../src/core/Constants');
const Store = require('../_mock/ReadModelStore');

const getEvent = (replay = false) => ({
    aggregateId: '0648b417-80c7-42ca-a027-9efe08bc00c4',
    type: 'EXAMPLE_EVENT',
    payload: {
        field: 'value'
    },
    position: 42,
    isReplay: replay
});

let store;
beforeEach(() => {
    store = new Store();
});

describe('ReadModelStore init function', () => {
    test('gets called', async () => {
        const init = jest.fn(async () => {});
        const rms = new ReadModelStore(store, {
            [READMODEL_INIT_FUNCTION]: init
        });
        await rms.init();

        expect(init).toHaveBeenCalledTimes(1);
        expect(init).toHaveBeenNthCalledWith(1, store);
    });

    test('is optional', () => {
        const rms = new ReadModelStore(store, {});
        expect(rms.init()).resolves.not.toThrow();
    });
});

describe('ReadModelStore', () => {
    test('respects config', async () => {
        const config = {test: 42};
        const init = jest.fn(async () => config);
        const rms = new ReadModelStore(store, {
            [READMODEL_INIT_FUNCTION]: init
        });
        await rms.init();

        expect(rms.config).toStrictEqual(config);
    });

    test('executes store functions', async () => {
        const NEW_TABLE_NAME = 'newTable';
        const EXISTING_TABLE_NAME = 'existingTable';
        const TABLE_SCHEME = {field: 'string'};
        await store.defineTable(EXISTING_TABLE_NAME, TABLE_SCHEME);

        const init = jest.fn(async store => {
            await store.defineTable(NEW_TABLE_NAME, TABLE_SCHEME);
            await store.defineTable(EXISTING_TABLE_NAME, TABLE_SCHEME);
        });
        const eventHandler = jest.fn(async (store/* , event */) => {
            await store.insert(NEW_TABLE_NAME);
            await store.insert(EXISTING_TABLE_NAME);
        });

        const event = getEvent();
        const rms = new ReadModelStore(store, {
            [READMODEL_INIT_FUNCTION]: init,
            [event.type]: eventHandler
        });
        await rms.init();
        const storeProxy = rms.createProxy(event);
        await eventHandler(storeProxy, event);
        
        expect(eventHandler).toHaveBeenCalledTimes(1);
        expect(eventHandler).toHaveBeenNthCalledWith(1, storeProxy, event);
        
        expect(store.insert).toHaveBeenCalledTimes(2);
        expect(store.insert).toHaveBeenNthCalledWith(1, NEW_TABLE_NAME, {position: event.position, operation: 1});
        expect(store.insert).toHaveBeenNthCalledWith(2, EXISTING_TABLE_NAME, {position: event.position, operation: 2});
    });

    test('prevents executing state changing store functions for replayed events on existing tables', async () => {
        const NEW_TABLE_NAME = 'newTable';
        const EXISTING_TABLE_NAME = 'existingTable';
        const TABLE_SCHEME = {field: 'string'};
        await store.defineTable(EXISTING_TABLE_NAME, TABLE_SCHEME);

        const init = jest.fn(async store => {
            await store.defineTable(NEW_TABLE_NAME, TABLE_SCHEME);
            await store.defineTable(EXISTING_TABLE_NAME, TABLE_SCHEME);
        });
        const eventHandler = jest.fn(async (store/* , event */) => {
            await store.insert(NEW_TABLE_NAME);
            await store.update(NEW_TABLE_NAME);
            await store.delete(NEW_TABLE_NAME);
            await store.find(NEW_TABLE_NAME);

            await store.insert(EXISTING_TABLE_NAME);
            await store.update(EXISTING_TABLE_NAME);
            await store.delete(EXISTING_TABLE_NAME);
            await store.find(EXISTING_TABLE_NAME);
        });

        const event = getEvent(true);
        const rms = new ReadModelStore(store, {
            [READMODEL_INIT_FUNCTION]: init,
            [event.type]: eventHandler
        });
        await rms.init();
        const storeProxy = rms.createProxy(event);
        await eventHandler(storeProxy, event);
        
        expect(eventHandler).toHaveBeenCalledTimes(1);
        expect(eventHandler).toHaveBeenNthCalledWith(1, storeProxy, event);
        
        expect(store.insert).toHaveBeenCalledTimes(1);
        expect(store.insert).toHaveBeenNthCalledWith(1, NEW_TABLE_NAME, {operation: 1, position: event.position});
        
        expect(store.update).toHaveBeenCalledTimes(1);
        expect(store.update).toHaveBeenNthCalledWith(1, NEW_TABLE_NAME, {operation: 2, position: event.position});
        
        expect(store.delete).toHaveBeenCalledTimes(1);
        expect(store.delete).toHaveBeenNthCalledWith(1, NEW_TABLE_NAME, {operation: 3, position: event.position});
        
        expect(store.find).toHaveBeenCalledTimes(2);
        expect(store.find).toHaveBeenNthCalledWith(1, NEW_TABLE_NAME, {operation: 3, position: event.position});
        expect(store.find).toHaveBeenNthCalledWith(2, EXISTING_TABLE_NAME, {operation: 3, position: event.position});
    });
});
