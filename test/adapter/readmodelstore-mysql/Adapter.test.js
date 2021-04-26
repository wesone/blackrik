import Adapter from '../../../src/adapters/readmodelstore-mysql/Adapter';
const tableName = 'TestTable';

let consoleSpy;
beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(async () => {
    consoleSpy.mockRestore();
});


test('print debugSql', async () => {
    
    const adapter = new Adapter({database: 'test', debugSql: true});
    adapter.connection = {
        threadId: 1,
        execute: jest.fn(),
    };
    await adapter.find(tableName, {id: 1});
    expect(consoleSpy).toHaveBeenCalledWith('SELECT * FROM `TestTable` WHERE `id` = ?', '["1"]', '');
});

test('print debugSql with transaction', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const adapter = new Adapter({database: 'test', debugSql: true});
    
    adapter.connection = {
        threadId: 1,
        execute: jest.fn(),
        beginTransaction: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn()
    };
    await adapter.beginTransaction();
    expect(adapter.isTransaction).toEqual(true);
    await adapter.dropTable(tableName);
    await adapter.commit();
    expect(consoleSpy).toHaveBeenCalledWith('DROP TABLE IF EXISTS `TestTable`', '"[NO PARAMS]"', 'TRANSACTION(1)');
});

test('delete rollback', async () => {
    const adapter = new Adapter({database: 'test', debugSql: true});
    const expectedError = new Error('Error');
    adapter.connection = {
        threadId: 1,
        execute: jest.fn().mockImplementation(query => { 
            if(query.startsWith('UPDATE')) 
                throw expectedError;
            return [{affectedRows: 1}];
        }),
        beginTransaction: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn()
    };

    await adapter.useDB();
    expect(adapter.connection.execute).toHaveBeenCalledTimes(0);

    await expect(adapter.delete(tableName, {id: 1}, 1)).rejects.toThrow(expectedError);
    expect(adapter.connection.rollback).toHaveBeenCalled();
});

test('defineTable errors', async () => {
    const adapter = new Adapter({database: 'test', debugSql: true});
    const expectedError = new Error('Tried replay on unmanaged table. Check TABLE_COMMENT.');
    adapter.connection = {
        threadId: 1,
        execute: jest.fn(),
        beginTransaction: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn()
    };

    adapter.findOne = jest.fn().mockImplementation(() => ({TABLE_COMMENT: 'asd'}));
    await expect(adapter.defineTable(tableName, {id: 'string'})).rejects.toThrow(expectedError);

});

test('defineTable already in progress', async () => {
    const adapter = new Adapter({database: 'test', debugSql: true});
    const expectedError = new Error('MySQL `Table already exists` mock error');
    expectedError.errno = 1050;
    adapter.connection = {
        threadId: 1,
        execute: jest.fn().mockImplementation(query => { 
            if(query.startsWith('CREATE')) 
                throw expectedError;
            return [{affectedRows: 1}];
        }),
        beginTransaction: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn()
    };

    adapter.findOne = jest.fn().mockImplementation(() => ({TABLE_COMMENT: '1:9d4df0dfc453e2d862325cdab8ebb358853b2359c0702ec9664dc9d9c048502cda73564e56e3eac15a5271caf337b584a00c87044bdb7824dd04b036346e53e6'}));
    await expect(adapter.defineTable(tableName, {id: 'string'})).resolves.toEqual(false);
});

test('defineTable error with position', async () => {
    const adapter = new Adapter({database: 'test', debugSql: true});
    const expectedError = new Error('Tried replay on unmanaged table. Check TABLE_COMMENT.');
    adapter.connection = {
        threadId: 1,
        execute: jest.fn().mockImplementation(query => { 
            if(query.startsWith('CREATE')) 
                throw expectedError;
            return [{affectedRows: 1}];
        }),
        beginTransaction: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn()
    };

    adapter.findOne = jest.fn().mockImplementation(() => ({TABLE_COMMENT: '1:9d4df0dfc453e2d862325cdab8ebb358853b2359c0702ec9664dc9d9c048502cda73564e56e3eac15a5271caf337b584a00c87044bdb7824dd04b036346e53e6'}));
    await expect(adapter.defineTable(tableName, {id: 'string'})).rejects.toThrow(expectedError);
});

test('delete error without position', async () => {
    const adapter = new Adapter({database: 'test', debugSql: true});
    const expectedError = new Error();
    adapter.connection = {
        threadId: 1,
        execute: jest.fn().mockImplementation(query => { 
            if(query.startsWith('DELETE')) 
                throw expectedError;
            return [{affectedRows: 1}];
        }),
        beginTransaction: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn()
    };

    await expect(adapter.delete(tableName, {id: 1})).rejects.toThrow(expectedError);
});

test('disconnect', async () => {
    const adapter = new Adapter({database: 'test', debugSql: true});

    await expect(adapter.disconnect()).resolves.toBeUndefined();

    adapter.connection = {
        threadId: 1,
        end: jest.fn()
    };
    
    await expect(adapter.disconnect()).resolves.toBeUndefined();
    expect(adapter.connection).toBeFalsy();
});

test('default values', async () => {
    const adapter = new Adapter({database: 'test', debugSql: true});
    expect(adapter.getAffectedCount([])).toEqual(0);

    const expectedError = new Error('Data not yet availible');
    expectedError.status = 409;
    adapter.exec = jest.fn().mockImplementation(() => [[],[]]);
    await expect(adapter.find(tableName, {id: 1}, {position: 1})).rejects.toEqual(expectedError);

    adapter.find = jest.fn().mockImplementation(() => []);
    await expect(adapter.count(tableName, {id: 1})).resolves.toEqual(0);
});
