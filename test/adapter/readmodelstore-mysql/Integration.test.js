
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
    return adapter.disconnect();
});

test('test with MySQL DB', async () => {

    let result;

    await adapter.dropTable(tableName);

    await adapter.defineTable(tableName, {
        id: {
            type: 'Integer',
            primaryKey: true,
            autoIncrement: true,
        },
        test: {
            type: 'String',
        }
    });

    result = await adapter.insert(tableName, {
        test: 'Hello world'
    });
    const id = result.id;

    await adapter.update(tableName,{id}, {test: 'Hello world!'});

    result = await adapter.findOne(tableName, {id});

    const expectedResult = {'id':id,'test':'Hello world!'};
    expect(result).toEqual(expectedResult);

    const count = await adapter.count(tableName, {});
    expect(count).toEqual(1);

    await adapter.delete(tableName, {id});

    const count2 = await adapter.count(tableName, {});
    expect(count2).toEqual(0);

});

test('table schema changes', async () => {
    let result;

    const schema1 = {
        id: {
            type: 'Integer',
            primaryKey: true,
            autoIncrement: true,
        },
        test: {
            type: 'String',
        }
    };

    const schema2 = {
        id: {
            type: 'Integer',
            primaryKey: true,
            autoIncrement: true,
        },
        test: {
            type: 'String',
        },
        test2: {
            type: 'Boolean'
        }
    };

    await adapter.dropTable(tableName);

    await adapter.defineTable(tableName, schema1);

    await adapter.defineTable(tableName, schema2);

    result = await adapter.insert(tableName, {
        test: 'Hello world!',
        test2: true
    });
    const id = result.id;

    await adapter.defineTable(tableName, schema2);

    result = await adapter.checkTable(tableName + '_new', '');
    expect(result?.description).toEqual('new');

    result = await adapter.checkTable(tableName + '_old', '');
    expect(result?.description).toEqual('new');

    result = await adapter.findOne(tableName, {id});

    const expectedResult = {'id':id,'test':'Hello world!', test2: 1};
    expect(result).toEqual(expectedResult);

    result = await adapter.count(tableName);
    expect(result).toEqual(1);

});

test('JSON handling', async () => {
    let result;

    const schema = {
        id: {
            type: 'Integer'
        },
        myJSON: {
            type: 'JSON',
        }
    };

    await adapter.dropTable(tableName);

    await adapter.defineTable(tableName, schema);


    await adapter.insert(tableName, {
        id: 1,
        myJSON: {text: 'Hello World!'},
    });

    await adapter.insert(tableName, {
        id: 2,
        myJSON: ['Hello', 'World', '!'],
    });
    
    result = await adapter.count(tableName);
    expect(result).toEqual(2);

    result = await adapter.findOne(tableName, {id: 1});
    let expectedResult = {'id':1, myJSON: {text:'Hello World!'}};
    expect(result).toEqual(expectedResult);

    result = await adapter.findOne(tableName, {id: 2});
    expectedResult = {'id':2, myJSON: ['Hello', 'World', '!']};
    expect(result).toEqual(expectedResult);

});
