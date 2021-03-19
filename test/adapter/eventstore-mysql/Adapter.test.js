const Adapter = require('../../../src/adapters/eventstore-mysql/Adapter');
const instance = require('../../testExample/testInstance');
const mysql = require('mysql2');
const testInstance = instance.eventStoreAdapter.args;

test('Constructor set config', () => {
    const testObj = new Adapter(testInstance);
    expect(testObj.config).toBe(testInstance);
    // init() call
    // expect(testObj.db).not.toBe(undefined);
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

// async init()
//     {
//         // console.log('init');
//         await this.createDatabase();
//         this.db = mysql.createConnection(this.config);
//         await this.db.connect();
//         await this.createTable();
//         // todo check if scheme is valid
//     }
// describe('Test init', () => {
//     test('DB connection', () => {
//         const db = {};
//     });
// });

describe('Create database and terminate connection', () => {
    const testObj = new Adapter(testInstance);
    test('Query', async () => {
        const mockConnection = {
            // query: Promise.resolve('QUERY RESOLVE'),
            // query: jest.fn(arg => Promise.resolve(console.log(arg))),
            query: jest.fn((arg, arg1) => arg1()),
            end: jest.fn(() => Promise.resolve(console.log('geendigt')))
        };
        const spyQuery= jest.spyOn(mockConnection, 'query');
        const spyEnd = jest.spyOn(mockConnection, 'end');

        // await mysql.createDatabase({
        //     host: 'localhost',
        //     database: 'eventStore',
        //     user: 'root',
        //     password: '1234'
        // });

        // console.log('mock fun: ',await mockConnection.query());

        testObj.createDatabase(mockConnection);
        expect(spyQuery).toHaveBeenCalled();
        expect(spyEnd).toHaveBeenCalled();
    });
});
