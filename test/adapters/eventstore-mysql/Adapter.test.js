const Adapter = require('../../../src/adapters/eventstore-mysql/Adapter');
const {EVENT_LIMIT_REPLAY} = require('../../../src/core/Constants');
const Event = require('../../../src/core/Event');
const mysql = require('mysql2/promise');
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
        createConnection: mockCreateConnection
    };
});

const testConfig = {
    host: 'localhost',
    database: 'eventstore',
    user: 'root',
    password: '1234'
};
const table = [[
    {
        Field: 'id',
        Type: 'varchar(36)',
        Null: 'NO',
        Key: 'PRI',
        Default: null,
        Extra: ''
    },
    {
        Field: 'position',
        Type: 'bigint',
        Null: 'NO',
        Key: 'UNI',
        Default: null,
        Extra: 'auto_increment'
    },
    {
        Field: 'aggregateId',
        Type: 'varchar(36)',
        Null: 'NO',
        Key: 'MUL',
        Default: null,
        Extra: ''
    },
    {
        Field: 'aggregateVersion',
        Type: 'int',
        Null: 'NO',
        Key: '',
        Default: null,
        Extra: ''
    },
    {
        Field: 'type',
        Type: 'varchar(32)',
        Null: 'NO',
        Key: 'MUL',
        Default: null,
        Extra: ''
    },
    {
        Field: 'timestamp',
        Type: 'bigint',
        Null: 'NO',
        Key: 'MUL',
        Default: null,
        Extra: ''
    },
    {
        Field: 'correlationId',
        Type: 'varchar(36)',
        Null: 'NO',
        Key: 'MUL',
        Default: null,
        Extra: ''
    },
    {
        Field: 'causationId',
        Type: 'varchar(36)',
        Null: 'YES',
        Key: 'MUL',
        Default: null,
        Extra: ''
    },
    {
        Field: 'payload',
        Type: 'text',
        Null: 'YES',
        Key: '',
        Default: null,
        Extra: ''
    }
]];
const databaseSchema = {
    fields: {
        id: {
            Field: 'id',
            Type: 'varchar(36)',
            Null: 'NO',
            Key: 'PRI',
            Default: null,
            Extra: ''
        },
        position: {
            Field: 'position',
            Type: 'bigint',
            Null: 'NO',
            Key: 'UNI',
            Default: null,
            Extra: 'auto_increment'
        },
        aggregateId: {
            Field: 'aggregateId',
            Type: 'varchar(36)',
            Null: 'NO',
            Key: 'MUL',
            Default: null,
            Extra: ''
        },
        aggregateVersion: {
            Field: 'aggregateVersion',
            Type: 'int',
            Null: 'NO',
            Key: '',
            Default: null,
            Extra: ''
        },
        type: {
            Field: 'type',
            Type: 'varchar(32)',
            Null: 'NO',
            Key: 'MUL',
            Default: null,
            Extra: ''
        },
        timestamp: {
            Field: 'timestamp',
            Type: 'bigint',
            Null: 'NO',
            Key: 'MUL',
            Default: null,
            Extra: ''
        },
        correlationId: {
            Field: 'correlationId',
            Type: 'varchar(36)',
            Null: 'NO',
            Key: 'MUL',
            Default: null,
            Extra: ''
        },
        causationId: {
            Field: 'causationId',
            Type: 'varchar(36)',
            Null: 'YES',
            Key: 'MUL',
            Default: null,
            Extra: ''
        },
        payload: {
            Field: 'payload',
            Type: 'text',
            Null: 'YES',
            Key: '',
            Default: null,
            Extra: ''
        }
    },
    options: {
        uniqueKey: {
            name: 'streamId',
            fields: ['aggregateId', 'aggregateVersion']
        }
    }
};

describe('Correct object construction', () => {
    test('Constructor set config', () => {
        const testObj = new Adapter(testConfig);
        expect(testObj.config).toBe(testConfig);
    });
});

describe('Test validateConfig ', () => {
    test('No config error', () => {
        expect(() => new Adapter()).toThrow();
    });
    test('No host error', () => {
        const copyInstance = JSON.parse(JSON.stringify(testConfig));
        copyInstance.host = null;
        expect(() => new Adapter(copyInstance)).toThrow();
    });
    test('No port', () => {
        const copyInstance = JSON.parse(JSON.stringify(testConfig));
        copyInstance.port = null;
        const testObj = new Adapter(copyInstance);
        expect(testObj.config.port).toBe(3306);
    });
    test('No database error', () => {
        const copyInstance = JSON.parse(JSON.stringify(testConfig));
        copyInstance.database = null;
        expect(() => new Adapter(copyInstance)).toThrow();

    });
    test('No user error', () => {
        const copyInstance = JSON.parse(JSON.stringify(testConfig));
        copyInstance.user = null;
        expect(() => new Adapter(copyInstance)).toThrow();

    });
    test('No password error', () => {
        const copyInstance = JSON.parse(JSON.stringify(testConfig));
        copyInstance.password = null;
        expect(() => new Adapter(copyInstance)).toThrow();
    });
    test('Successful adapter creation', () => {
        expect(() => new Adapter(testConfig)).not.toThrow();
    });
});

describe('Test init', () => {
    test('Check for function calls', async () => {
        const testObj = new Adapter(testConfig);
        testObj.createDatabase = jest.fn();
        testObj.createTable = jest.fn();

        const spyCreateDatabase = jest.spyOn(testObj, 'createDatabase');
        const spyCreateTable = jest.spyOn(testObj, 'createTable');
        const spyCreateConnection = jest.spyOn(mysql, 'createConnection');
        const spyConnect = jest.spyOn(mysql.createConnection(), 'connect');        
        await testObj.init();

        expect(spyCreateDatabase).toHaveBeenCalled();
        expect(spyCreateTable).toHaveBeenCalled();
        expect(spyCreateConnection).toHaveBeenCalled();
        expect(spyConnect).toHaveBeenCalled();
    });
});

describe('Test save', () => {
    test('Check for execute and return value', async () => {
        const testObj = new Adapter(testConfig);
        const mockConnection = {execute: jest.fn(() => [{insertId: '123'}])};
        testObj.db = mockConnection;
        const data = {
            aggregateId: '001',
            aggregateVersion: 0,
            type: 'USER_UPDATED',
            correlationId: '111',
            causation: '100',
            payload: 'TEST'
        };
        const expected = '123';
        const testEvent = new Event(data);
        const result = await testObj.save(testEvent);
        
        const spyExecute = jest.spyOn(mockConnection, 'execute');
        
        expect(spyExecute).toHaveBeenCalled();
        expect(result).toBe(expected);
    });
    test('Throw error', async () => {
        const testObj = new Adapter(testConfig);
        const mockConnection = {execute: jest.fn()};
        testObj.db = mockConnection;
        const data = {
            aggregateId: '001',
            aggregateVersion: 0,
            type: 'USER_UPDATED',
            correlationId: '111',
            causation: '100',
            payload: 'TEST'
        };
        const testEvent = new Event(data);

        try 
        {
            await testObj.save(testEvent);
        } 
        catch(error)
        {
            expect(error).not.toBe(undefined);            
        }
        
        const spyExecute = jest.spyOn(mockConnection, 'execute');
        expect(spyExecute).toHaveBeenCalled();
    });
    test('Throw error with number 1062', async () => {
        const testObj = new Adapter(testConfig);
        const error = new Error('test error');
        error.errno = 1062;
        const mockConnection = {execute: jest.fn(() => {throw error;})};
        testObj.db = mockConnection;
        const data = {
            aggregateId: '001',
            aggregateVersion: 0,
            type: 'USER_UPDATED',
            correlationId: '111',
            causation: '100',
            payload: 'TEST'
        };
        const testEvent = new Event(data);
        let result;
        try 
        {
            result = await testObj.save(testEvent);
        } 
        catch(error)
        {
            expect(result).toBe(false);            
            expect(error.errno).toBe(1062);            
        }
        
        const spyExecute = jest.spyOn(mockConnection, 'execute');
        expect(spyExecute).toHaveBeenCalled();
    });
});
test('Throw error and reconnect', async () => {
    const testObj = new Adapter(testConfig);
    const error = new Error('test error');
    error.fatal = true;
    const mockConnection = {execute: jest.fn(() => {throw error;})};
    testObj.db = mockConnection;
    const data = {
        aggregateId: '001',
        aggregateVersion: 0,
        type: 'USER_UPDATED',
        correlationId: '111',
        causation: '100',
        payload: 'TEST'
    };
    const testEvent = new Event(data);

    try 
    {
        await testObj.save(testEvent);
    } 
    catch(error)
    {
        expect(error).not.toBe(undefined);            
    }
    
    const spyExecute = jest.spyOn(mockConnection, 'execute');
    expect(spyExecute).toHaveBeenCalled();

    expect(testObj.db).toBe(null);

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

    testObj.connect = jest.fn(() => testObj.db = { execute: jest.fn()});
    testObj.db = null;

    await testObj.execute();

    expect(testObj.db).not.toBe(null);

});

describe('Test load', () => {
    test('Check for correct loading of events', async () => {
        const testObj = new Adapter(testConfig);
        const expected = [
            { payload: { test: 42 } },
            { payload: { test: 42 } },
            { payload: { test: 42 } }
        ];
        const next = null;
        const filter = {
            aggregateIds: ['one', 'two', 'three'],
            types: ['USER_CREATED', 'USER_UPDATED'],
            correlationIds: ['id1', 'id2', 'id3'],
            causationIds: ['id3', 'id2', 'id1'],
            since: 1234,
            until: 4321,
            limit: EVENT_LIMIT_REPLAY,
            cursor: next
        };
        const expectedToExecute = 'SELECT * FROM events WHERE aggregateId IN (?,?,?) AND type IN (?,?) AND correlationId IN (?,?,?) AND causationId IN (?,?,?) AND timestamp >= ? AND timestamp < ? ORDER BY position ASC LIMIT ? OFFSET ?';
        const expectedValues = [
            'one',
            'two',
            'three',
            'USER_CREATED',
            'USER_UPDATED',
            'id1',
            'id2',
            'id3',
            'id3',
            'id2',
            'id1',
            1234,
            4321,
            1000,
            0
        ];
        const mockConnection = {
            execute: jest.fn(() => 
                [[
                    {payload: '{"test": 42}'},
                    {payload: '{"test": 42}'},
                    {payload: '{"test": 42}'}
                ]])
        };
        const spyExecute= jest.spyOn(mockConnection, 'execute');

        testObj.db = mockConnection;
        const {events, cursor, debug}  = await testObj.load(filter);
        expect(spyExecute).toHaveBeenCalled();
        expect(events).toStrictEqual(expected);
        expect(cursor).toBe(null);
        expect(debug.toExecute).toEqual(expectedToExecute);
        expect(debug.values).toEqual(expectedValues);
    });
    test('Check for correct loading of events - to types', async () => {
        const testObj = new Adapter(testConfig);
        const expected = [
            { payload: { test: 42 } },
            { payload: { test: 42 } },
            { payload: { test: 42 } }
        ];
        const next = null;
        const filter = {
            aggregateIds: ['one', 'two', 'three'],
            // types: ['USER_CREATED', 'USER_UPDATED'],
            correlationIds: ['id1', 'id2', 'id3'],
            causationIds: ['id3', 'id2', 'id1'],
            since: 1234,
            until: 4321,
            limit: EVENT_LIMIT_REPLAY,
            cursor: next
        };
        const expectedToExecute = 'SELECT * FROM events WHERE aggregateId IN (?,?,?) AND correlationId IN (?,?,?) AND causationId IN (?,?,?) AND timestamp >= ? AND timestamp < ? ORDER BY position ASC LIMIT ? OFFSET ?';
        const expectedValues = [
            'one',
            'two',
            'three',
            'id1',
            'id2',
            'id3',
            'id3',
            'id2',
            'id1',
            1234,
            4321,
            1000,
            0
        ];
        const mockConnection = {
            execute: jest.fn(() => 
                [[
                    {payload: '{"test": 42}'},
                    {payload: '{"test": 42}'},
                    {payload: '{"test": 42}'}
                ]])
        };
        const spyExecute= jest.spyOn(mockConnection, 'execute');

        testObj.db = mockConnection;
        const {events, cursor, debug}  = await testObj.load(filter);
        expect(spyExecute).toHaveBeenCalled();
        expect(events).toStrictEqual(expected);
        expect(cursor).toBe(null);
        expect(debug.toExecute).toEqual(expectedToExecute);
        expect(debug.values).toEqual(expectedValues);
    });
    test('Check for correct loading of events with correlationIds in filter', async () => {
        const testObj = new Adapter(testConfig);
        const expected = [
            { payload: { test: 42 } },
            { payload: { test: 42 } },
            { payload: { test: 42 } }
        ];
        const next = null;
        const filter = {
            aggregateIds: ['one', 'two', 'three'],
            correlationIds: [1, 2, 3],
            since: 1234,
            until: 4321,
            limit: EVENT_LIMIT_REPLAY,
            cursor: next,
            types:
                ['USER_CREATED', 'USER_UPDATED']
        };
        const expectedToExecute = 'SELECT * FROM events WHERE aggregateId IN (?,?,?) AND type IN (?,?) AND correlationId IN (?,?,?) AND timestamp >= ? AND timestamp < ? ORDER BY position ASC LIMIT ? OFFSET ?';
        const expectedValues = [
            'one',
            'two',
            'three',
            'USER_CREATED',
            'USER_UPDATED',
            1,
            2,
            3,
            1234,
            4321,
            1000,
            0
        ];
        const mockConnection = {
            execute: jest.fn(() =>
                [[
                    {payload: '{"test": 42}'},
                    {payload: '{"test": 42}'},
                    {payload: '{"test": 42}'}
                ]])
        };
        const spyExecute= jest.spyOn(mockConnection, 'execute');


        testObj.db = mockConnection;
        const {events, cursor, debug}  = await testObj.load(filter);
        expect(spyExecute).toHaveBeenCalled();
        expect(events).toStrictEqual(expected);
        expect(cursor).toBe(null);
        expect(debug.toExecute).toEqual(expectedToExecute);
        expect(debug.values).toEqual(expectedValues);
    });
    test('Check for correct loading of events with causationIds in filter', async () => {
        const testObj = new Adapter(testConfig);
        const expected = [
            { payload: { test: 42 } },
            { payload: { test: 42 } },
            { payload: { test: 42 } }
        ];
        const next = null;
        const filter = {
            aggregateIds: ['one', 'two', 'three'],
            causationIds: [1, 2, 3],
            since: 1234,
            until: 4321,
            limit: EVENT_LIMIT_REPLAY,
            cursor: next,
            types:
                ['USER_CREATED', 'USER_UPDATED']
        };
        const expectedToExecute = 'SELECT * FROM events WHERE aggregateId IN (?,?,?) AND type IN (?,?) AND causationId IN (?,?,?) AND timestamp >= ? AND timestamp < ? ORDER BY position ASC LIMIT ? OFFSET ?';
        const expectedValues = [
            'one',
            'two',
            'three',
            'USER_CREATED',
            'USER_UPDATED',
            1,
            2,
            3,
            1234,
            4321,
            1000,
            0
        ];
        const mockConnection = {
            execute: jest.fn(() =>
                [[
                    {payload: '{"test": 42}'},
                    {payload: '{"test": 42}'},
                    {payload: '{"test": 42}'}
                ]])
        };
        const spyExecute= jest.spyOn(mockConnection, 'execute');


        testObj.db = mockConnection;
        const {events, cursor, debug}  = await testObj.load(filter);
        expect(spyExecute).toHaveBeenCalled();
        expect(events).toStrictEqual(expected);
        expect(cursor).toBe(null);
        expect(debug.toExecute).toEqual(expectedToExecute);
        expect(debug.values).toEqual(expectedValues);
    });
    test('Check for correct loading of events - undefined limit', async () => {
        const testObj = new Adapter(testConfig);
        const expected = [
            { payload: { test: 42 } },
            { payload: { test: 42 } },
            { payload: { test: 42 } }
        ];
        const next = null;
        const filter = {
            aggregateIds: ['one', 'two', 'three'],
            types: 
                ['USER_CREATED', 'USER_UPDATED'],
            correlationIds: ['id1', 'id2', 'id3'],
            causationIds: ['id3', 'id2', 'id1'],
            since: 1234,
            until: 4321,
            limit: undefined,
            cursor: next
        };
        const expectedToExecute = 'SELECT * FROM events WHERE aggregateId IN (?,?,?) AND type IN (?,?) AND correlationId IN (?,?,?) AND causationId IN (?,?,?) AND timestamp >= ? AND timestamp < ? ORDER BY position ASC ';
        const expectedValues = [
            'one',
            'two',
            'three',
            'USER_CREATED',
            'USER_UPDATED',
            'id1',
            'id2',
            'id3',
            'id3',
            'id2',
            'id1',
            1234,
            4321,
        ];
        const mockConnection = {
            execute: jest.fn(() => 
                [[
                    {payload: '{"test": 42}'},
                    {payload: '{"test": 42}'},
                    {payload: '{"test": 42}'}
                ]]) 
        };
        const spyExecute= jest.spyOn(mockConnection, 'execute');
 

        testObj.db = mockConnection;
        const {events, cursor, debug}  = await testObj.load(filter);
        expect(spyExecute).toHaveBeenCalled();
        expect(events).toStrictEqual(expected);
        expect(cursor).toBe(null);
        expect(debug.toExecute).toEqual(expectedToExecute);
        expect(debug.values).toEqual(expectedValues);
    });
    test('Check for correct loading of events - cursor increment', async () => {
        const testObj = new Adapter(testConfig);
        const expected = [
            { payload: { test: 42 } },
            { payload: { test: 42 } },
            { payload: { test: 42 } }
        ];
        const next = null;
        const filter = {
            limit: 1,
            cursor: next,
            types: 
                ['USER_CREATED', 'USER_UPDATED']
        };

        const mockConnection = {
            execute: jest.fn(() => 
                [[
                    {payload: '{"test": 42}'},
                    {payload: '{"test": 42}'},
                    {payload: '{"test": 42}'}
                ]])
        };
        const spyExecute= jest.spyOn(mockConnection, 'execute');
 

        testObj.db = mockConnection;
        const {events, cursor}  = await testObj.load(filter);
        expect(spyExecute).toHaveBeenCalled();
        expect(events).toStrictEqual(expected);
        expect(cursor).toBe(1);
    });
    test('Check for correct loading of events - cursor undefined', async () => {
        const testObj = new Adapter(testConfig);
        const expected = [
            { payload: { test: 42 } },
            { payload: { test: 42 } },
            { payload: { test: 42 } }
        ];
        const filter = {
            limit: 1,
            cursor: undefined,
            types: 
                ['USER_CREATED', 'USER_UPDATED']
        };

        const mockConnection = {
            execute: jest.fn(() => 
                [[
                    {payload: '{"test": 42}'},
                    {payload: '{"test": 42}'},
                    {payload: '{"test": 42}'}
                ]])
        };
        const spyExecute= jest.spyOn(mockConnection, 'execute');
 

        testObj.db = mockConnection;
        const {events}  = await testObj.load(filter);
        expect(spyExecute).toHaveBeenCalled();
        expect(events).toStrictEqual(expected);
    });
});

describe('Test close', () => {
    test('Calling end on db connection', async () => {
        const testObj = new Adapter(testConfig);
        const mockConnection = {
            end: jest.fn()
        };
        const spyEnd= jest.spyOn(mockConnection, 'end');

        testObj.db = mockConnection;
        await testObj.close();
        expect(spyEnd).toHaveBeenCalled();
    });
});

describe('Test createTable', () => {
    test('Create table - event count >= 1', async () => {
        const testObj = new Adapter(testConfig);
        let functionCallCheckEventCount = 0;
        let functionCallDescribeEvents = 0;
        let functionCallCreateTableEvents = 0;
        const mockConnection = {
            execute: jest.fn(arg1 => {
                if(arg1 === 'SELECT count(*) FROM information_schema.TABLES WHERE (TABLE_SCHEMA = ?) AND (TABLE_NAME = \'events\')')
                {
                    functionCallCheckEventCount++;   
                    return [[{ 'count(*)': 1 }]];
                }
                if(arg1 === 'DESCRIBE events')
                {
                    functionCallDescribeEvents++;
                    return table;
                }
                
                functionCallCreateTableEvents++;
            }),
        };
        const spyExecute= jest.spyOn(mockConnection, 'execute');

        testObj.db = mockConnection;
        await testObj.createTable();
        expect(spyExecute).toHaveBeenCalledTimes(2);
        expect(functionCallCheckEventCount).toBe(1);
        expect(functionCallDescribeEvents).toBe(1);
        expect(functionCallCreateTableEvents).toBe(0);
    });
    test('Create table - event count >= 1 and wrong schema', async () => {
        const testObj = new Adapter(testConfig);
        let functionCallCheckEventCount = 0;
        let functionCallDescribeEvents = 0;
        let functionCallCreateTableEvents = 0;
        const mockConnection = {
            execute: jest.fn(arg1 => {
                if(arg1 === 'SELECT count(*) FROM information_schema.TABLES WHERE (TABLE_SCHEMA = ?) AND (TABLE_NAME = \'events\')')
                {
                    functionCallCheckEventCount++;
                    return [[{ 'count(*)': 1 }]];
                }
                if(arg1 === 'DESCRIBE events')
                {
                    functionCallDescribeEvents++;
                    const copy = JSON.parse(JSON.stringify(table));
                    copy[0][0].Field = 'not a viable field';
                    return copy;
                }
                
                functionCallCreateTableEvents++;
            }),
        };
        const spyExecute= jest.spyOn(mockConnection, 'execute');

        testObj.db = mockConnection;
        try
        {
            await testObj.createTable();
            
        } 
        catch(error)
        {
            expect(error.message).toBe('Existing table schema is not valid.');
        }

        expect(spyExecute).toHaveBeenCalledTimes(2);
        expect(functionCallCheckEventCount).toBe(1);
        expect(functionCallDescribeEvents).toBe(1);
        expect(functionCallCreateTableEvents).toBe(0);
    });
    test('Create table - no events', async () => {
        const testObj = new Adapter(testConfig);
        let functionCallCheckEventCount = 0;
        let functionCallDescribeEvents = 0;
        let functionCallCreateTableEvents = 0;
        const mockConnection = {
            execute: jest.fn(arg1 => {
                if(arg1 === 'SELECT count(*) FROM information_schema.TABLES WHERE (TABLE_SCHEMA = ?) AND (TABLE_NAME = \'events\')')
                {
                    functionCallCheckEventCount++;   
                    return test = [[{ 'count(*)': 0 }]];
                }
                if(arg1 === 'DESCRIBE events')
                {
                    functionCallDescribeEvents++;
                }
                else 
                    functionCallCreateTableEvents++;
            }),
        };
        const spyExecute= jest.spyOn(mockConnection, 'execute');

        testObj.db = mockConnection;
        await testObj.createTable();
        expect(spyExecute).toHaveBeenCalledTimes(2);
        expect(functionCallCheckEventCount).toBe(1);
        expect(functionCallDescribeEvents).toBe(0);
        expect(functionCallCreateTableEvents).toBe(1);
    });
});

describe('Test createDatabase', () => {
    test('Create database and terminate connection', async () => {
        const testObj = new Adapter(testConfig);
        await testObj.createDatabase();
        expect(mysql.createConnection().execute).toHaveBeenCalled();
        expect(mysql.createConnection).toHaveBeenCalled();
        expect(mysql.createConnection().end).toHaveBeenCalled();
    });
});

describe('Test verifySchema', () => {
    test('Verify schema successfully', async () => {
        const testObj = new Adapter(testConfig);
        expect(await testObj.verifySchema(table[0], databaseSchema)).toBe(true);
    });
    test('Verify schema - no "Field" field', async () => {
        const testObj = new Adapter(testConfig);
        const copy = JSON.parse(JSON.stringify(table));
        delete copy[0][0].Field;
        expect(await testObj.verifySchema(copy[0], databaseSchema)).toBe(false);
    });
    test('Verify schema - no "Type" field', async () => {
        const testObj = new Adapter(testConfig);
        const copy = JSON.parse(JSON.stringify(table));
        delete copy[0][0].Type;
        expect(await testObj.verifySchema(copy[0], databaseSchema)).toBe(false);
    });
    test('Verify schema - no "Null" field', async () => {
        const testObj = new Adapter(testConfig);
        const copy = JSON.parse(JSON.stringify(table));
        delete copy[0][0].Null;
        expect(await testObj.verifySchema(copy[0], databaseSchema)).toBe(false);
    });
    test('Verify schema - no "Key" field', async () => {
        const testObj = new Adapter(testConfig);
        const copy = JSON.parse(JSON.stringify(table));
        delete copy[0][0].Key;
        expect(await testObj.verifySchema(copy[0], databaseSchema)).toBe(false);
    });
    test('Verify schema - no "Default" field', async () => {
        const testObj = new Adapter(testConfig);
        const copy = JSON.parse(JSON.stringify(table));
        delete copy[0][0].Default;
        expect(await testObj.verifySchema(copy[0], databaseSchema)).toBe(false);
    });
    test('Verify schema - no "Extra" field', async () => {
        const testObj = new Adapter(testConfig);
        const copy = JSON.parse(JSON.stringify(table));
        delete copy[0][0].Extra;
        expect(await testObj.verifySchema(copy[0], databaseSchema)).toBe(false);
    });
});

describe('Test buildFieldListFromSchema', () => {
    test('Correct build of fieldlist from scheme', () => {
        const expected = 'id varchar(36) not null,position bigint not null unique auto_increment,aggregateId varchar(36) not null,aggregateVersion int not null,type varchar(32) not null,timestamp bigint not null,correlationId varchar(36) not null,causationId varchar(36),payload text , PRIMARY KEY (id) , UNIQUE KEY `streamId` (aggregateId,aggregateVersion) , INDEX USING BTREE (aggregateId) , INDEX USING BTREE (type) , INDEX USING BTREE (timestamp) , INDEX USING BTREE (correlationId) , INDEX USING BTREE (causationId)';
        const testObj = new Adapter(testConfig);
        const result = testObj.buildFieldListFromSchema(databaseSchema);
        expect(result).toBe(expected);
    });
    test('Correct build of fieldlist from scheme with default values', () => {
        databaseSchema.fields.causationId.Default = 'NULL';
        const expected = 'id varchar(36) not null,position bigint not null unique auto_increment,aggregateId varchar(36) not null,aggregateVersion int not null,type varchar(32) not null,timestamp bigint not null,correlationId varchar(36) not null,causationId varchar(36) default NULL,payload text , PRIMARY KEY (id) , UNIQUE KEY `streamId` (aggregateId,aggregateVersion) , INDEX USING BTREE (aggregateId) , INDEX USING BTREE (type) , INDEX USING BTREE (timestamp) , INDEX USING BTREE (correlationId) , INDEX USING BTREE (causationId)';
        const testObj = new Adapter(testConfig);
        const result = testObj.buildFieldListFromSchema(databaseSchema);
        expect(result).toBe(expected);
    });
});

// see https://github.com/sidorares/node-mysql2/issues/1239
test('MySQL 8.0.22 (and higher) workaround', async () => {
    const testObj = new Adapter(testConfig); 
    testObj.createDatabase = jest.fn();
    testObj.createTable = jest.fn();

    await testObj.init();
    expect(testObj.db.execute('SELECT * FROM table WHERE ? = ?', ['test', 42])).toBe(undefined);
});
