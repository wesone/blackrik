
import Adapter from '../../../src/adapters/readmodelstore-mysql/Adapter';

const tableName = 'TestTable';

let adapter;

beforeAll(() => {
    adapter = new Adapter({ 
        //debugSql: true,
        host: 'localhost',
        user: 'root',
        password: '1234',
        database: 'AdapterTest'
    });
});

afterAll(() => {
    return adapter.diconnect();
});

test('test with MySQL DB', async () => {

    await adapter.dropTable(tableName);

    await adapter.createTable(tableName, {
        id: {
            type: 'Integer',
            primaryKey: true,
        },
        test: {
            type: 'String',
        }
    });

    await adapter.insert(tableName, {
        id: 1,
        test: 'Hello world'
    });

    await adapter.update(tableName,{id: 1}, {test: 'Hello world!'});

    const result = await adapter.findOne(tableName, {
        conditions: {
            id: 1,
        }
    });

    const expectedResult = {'id':1,'test':'Hello world!'};

    expect(result).toEqual(expectedResult);
});
