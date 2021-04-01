const Adapter = require('../../../src/adapters/eventstore-mysql/Adapter');
const instance = require('../../../examples/hello-world/config');
const {EVENT_LIMIT_REPLAY} = require('../../../src/core/Constants');
const Event = require('../../../src/core/Event');

const testInstance = instance.eventStoreAdapter.args;
const schema = {
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
            Null: 'NO',
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

// beforeEach(() => {
//     const testObj = 'test';
// });

describe('Correct object construction', () => {
    test('Constructor set config', () => {
        const testObj = new Adapter(testInstance);
        expect(testObj.config).toBe(testInstance);
    });
});

describe('Test validateConfig ', () => {
    test('No config error', () => {
        expect(() => new Adapter()).toThrow();
    });
    test('No host error', () => {
        const copyInstance = JSON.parse(JSON.stringify(testInstance));
        copyInstance.host = null;
        expect(() => new Adapter(copyInstance)).toThrow();

    });
    test('No database error', () => {
        const copyInstance = JSON.parse(JSON.stringify(testInstance));
        copyInstance.database = null;
        expect(() => new Adapter(copyInstance)).toThrow();

    });
    test('No user error', () => {
        const copyInstance = JSON.parse(JSON.stringify(testInstance));
        copyInstance.user = null;
        expect(() => new Adapter(copyInstance)).toThrow();

    });
    test('No password error', () => {
        const copyInstance = JSON.parse(JSON.stringify(testInstance));
        copyInstance.password = null;
        expect(() => new Adapter(copyInstance)).toThrow();
    });
    test('Successful adapter creation', () => {
        expect(() => new Adapter(testInstance)).not.toThrow();
    });
});

describe('Test init', () => {
    test('Check for function calls', async () => {
        const mockCreateDatabase = jest.fn();
        const mockConnect = jest.fn();
        const mockExecute= jest.fn();

        const object = { // Object to spy on
            mockConnect, mockExecute
        };
        const mockCreateConnection = jest.fn(() => {
            return {
                connect: object.mockConnect,
                execute: object.mockExecute // does not get executeted in init() but still needed for a bind
            };
        });
        const mockMysql = {
            createConnection: mockCreateConnection
        };
        
        const mockCreateTable = jest.fn();
        const testObj = new Adapter(testInstance, mockMysql);
        testObj.createDatabase = mockCreateDatabase;
        testObj.createTable = mockCreateTable;

        const spyCreateDatabase = jest.spyOn(testObj, 'createDatabase');
        const spyCreateConnection = jest.spyOn(mockMysql, 'createConnection');
        const spyConnect= jest.spyOn(object, 'mockConnect');
        
        await testObj.init();

        expect(spyCreateDatabase).toHaveBeenCalled();
        expect(spyCreateConnection).toHaveBeenCalled();
        expect(spyConnect).toHaveBeenCalled();
    });
});

describe('Test save', () => {
    test('Check for execute and return value', async () => {
        const testObj = new Adapter(testInstance);
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
        
        testObj.db.execute();

        expect(spyExecute).toHaveBeenCalled();
        expect(result).toBe(expected);
    });
}),

describe('Test load', () => {
    test('Check for correct loading of events', async () => {
        const testObj = new Adapter(testInstance);
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
    test('Check for correct loading of events - undefined limit', async () => {
        const testObj = new Adapter(testInstance);
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
        const testObj = new Adapter(testInstance);
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
});

describe('Test close', () => {
    test('Calling end on db connection', async () => {
        const testObj = new Adapter(testInstance);
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
        const testObj = new Adapter(testInstance);
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
                    return schema;
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
        const testObj = new Adapter(testInstance);
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
                    const copy = JSON.parse(JSON.stringify(schema));
                    copy.fields = 'not a viable field';
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
        const testObj = new Adapter(testInstance);
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
        const testObj = new Adapter(testInstance);
        const mockConnection = {
            execute: jest.fn(),
            end: jest.fn()
        };
        const spyExecute= jest.spyOn(mockConnection, 'execute');
        const spyEnd = jest.spyOn(mockConnection, 'end');
    
        await testObj.createDatabase(mockConnection);
        expect(spyExecute).toHaveBeenCalled();
        expect(spyEnd).toHaveBeenCalled();
    });
});

describe('Test verifySchema', () => {
    test('Verify schema successfully', async () => {
        const testObj = new Adapter(testInstance);
        expect(await testObj.verifySchema(schema, schema)).toBe(true);
    });
    test('Verify schema - field not found', async () => {
        const testObj = new Adapter(testInstance);
        const copy = JSON.parse(JSON.stringify(schema));
        copy.fields = 'not a viable field';
        expect(await testObj.verifySchema(copy, schema)).toBe(false);
    });
    test('Verify schema - no "Type" field', async () => {
        const testObj = new Adapter(testInstance);
        const copy = JSON.parse(JSON.stringify(schema));
        copy.fields.id.Field = 'not a viable field';
        expect(await testObj.verifySchema(copy, schema)).toBe(false);
    });
    test('Verify schema - no "Null" field', async () => {
        const testObj = new Adapter(testInstance);
        const copy = JSON.parse(JSON.stringify(schema));
        copy.fields.id.Null = 'not a viable field';
        expect(await testObj.verifySchema(copy, schema)).toBe(false);
    });
    test('Verify schema - no "Key" field', async () => {
        const testObj = new Adapter(testInstance);
        const copy = JSON.parse(JSON.stringify(schema));
        copy.fields.id.Key = 'not a viable field';
        expect(await testObj.verifySchema(copy, schema)).toBe(false);
    });
    test('Verify schema - no "Default" field', async () => {
        const testObj = new Adapter(testInstance);
        const copy = JSON.parse(JSON.stringify(schema));
        copy.fields.id.Default = 'not a viable field';
        expect(await testObj.verifySchema(copy, schema)).toBe(false);
    });
    test('Verify schema - no "Extra" field', async () => {
        const testObj = new Adapter(testInstance);
        const copy = JSON.parse(JSON.stringify(schema));
        copy.fields.id.Extra = 'not a viable field';
        expect(await testObj.verifySchema(copy, schema)).toBe(false);
    });
});

describe('Test buildFieldListFromSchema', () => {
    const expected = 'id varchar(36) not null,position bigint not null unique auto_increment,aggregateId varchar(36) not null,aggregateVersion int not null,type varchar(32) not null,timestamp bigint not null,correlationId varchar(36) not null,causationId varchar(36),payload text not null , PRIMARY KEY (id) , UNIQUE KEY `streamId` (aggregateId,aggregateVersion) , INDEX USING BTREE (aggregateId) , INDEX USING BTREE (type) , INDEX USING BTREE (timestamp) , INDEX USING BTREE (correlationId) , INDEX USING BTREE (causationId)';
    test('Correct build of fieldlist from scheme', () => {
        const testObj = new Adapter(testInstance);
        const result = testObj.buildFieldListFromSchema(schema);
        expect(result).toBe(expected);
    });
});
