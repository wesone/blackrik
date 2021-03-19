const Adapter = require('../../../src/adapters/eventstore-mysql/Adapter');
const instance = require('../../../examples/hello-world/config');
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
