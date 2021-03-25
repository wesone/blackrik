const Adapter = require('../../../src/adapters/eventstore-mysql/Adapter');
const instance = require('../../../examples/hello-world/config');
const {EVENT_LIMIT_REPLAY} = require('../../../src/core/Constants');

const testInstance = instance.eventStoreAdapter.args;

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
        await testObj.createDatabase();
        expect(spyExecute).toHaveBeenCalled();
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
                    return [[{
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
                        Extra: 'auto_increment'},
                    {
                        Field: 'aggregateId',
                        Type: 'varchar(36)',
                        Null: 'NO',
                        Key: 'MUL',
                        Default: null,
                        Extra: ''
                    },{
                        Field: 'aggregateVersion',
                        Type: 'int',
                        Null: 'NO',
                        Key: '',
                        Default: null,
                        Extra: ''
                    },{
                        Field: 'type',
                        Type: 'varchar(32)',
                        Null: 'NO',
                        Key: '',
                        Default: null,
                        Extra: ''
                    },{
                        Field: 'timestamp',
                        Type: 'bigint',
                        Null: 'NO',
                        Key: '',
                        Default: null,
                        Extra: ''
                    },{
                        Field: 'correlationId',
                        Type: 'varchar(36)',
                        Null: 'NO',
                        Key: '',
                        Default: null,
                        Extra: ''
                    },{
                        Field: 'causationId',
                        Type: 'varchar(36)',
                        Null: 'YES',
                        Key: '',
                        Default: null,
                        Extra: ''
                    },{
                        Field: 'payload',
                        Type: 'text',
                        Null: 'NO',
                        Key: '',
                        Default: null,
                        Extra: ''
                    }]];
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

describe('Test buildFieldListFromSchema', () => {
    const expected = 'id varchar(36) not null,position bigint not null unique auto_increment,aggregateId varchar(36) not null,aggregateVersion int not null,type varchar(32) not null,timestamp bigint not null,correlationId varchar(36) not null,causationId varchar(36),payload text not null , primary key (id) , unique key `streamId` (aggregateId,aggregateVersion)';
    test('Correct build of fieldlist from scheme', () => {
        const testObj = new Adapter(testInstance);
        const result = testObj.buildFieldListFromSchema();
        expect(result).toBe(expected);
    });
});

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
            aggregateIds: [],
            limit: EVENT_LIMIT_REPLAY,
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
        expect(cursor).toBe(null);
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
