
import Adapter from '../../../src/adapters/readmodelstore-mysql/Adapter';
const tableName = 'TestTable';

let adapter;

beforeAll(() => {
    adapter = new Adapter({ 
        //debugSql: true,
        host: 'localhost',
        user: 'root',
        password: '1234',
        useDatabase: 'TestTable'
    });
});

afterAll(async () => {
    await adapter.exec(`DROP DATABASE IF EXISTS ${adapter.args.database}`, []);
    return adapter.disconnect();
});

test('test with MySQL DB', async () => {

    let result;

    await adapter.dropTable(tableName);

    await adapter.defineTable(tableName, {
        id: {
            type: 'Number',
            primaryKey: true,
        },
        test: {
            type: 'String',
        },
        date: {
            type: 'Date',
        }
    });

    result = await adapter.insert(tableName, {
        id: 1,
        test: 'Hello world',
        date: new Date('2021-12-17 02:24:00')
    });

    await adapter.update(tableName,{id: 1}, {test: 'Hello world!'});

    result = await adapter.findOne(tableName, {id: 1});

    const expectedResult = {
        'id': 1,
        'test': 'Hello world!',
        'date': new Date('2021-12-17 02:24:00'),
        '_lastPosition': null,
    };
    expect(result).toEqual(expectedResult);

    const count = await adapter.count(tableName, {});
    expect(count).toEqual(1);

    await adapter.delete(tableName, {id: 1});

    const count2 = await adapter.count(tableName, {});
    expect(count2).toEqual(0);

});

test('table schema changes', async () => {
    let result;

    const schema1 = {
        id: {
            type: 'Number',
            primaryKey: true,
        },
        test: {
            type: 'String',
        }
    };

    const schema2 = {
        id: {
            type: 'Number',
            primaryKey: true,
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
        id: 1,
        test: 'Hello world!',
        test2: true
    });

    await adapter.defineTable(tableName, schema2);

    result = await adapter.checkTable(tableName + '_new', '');
    expect(result?.description).toEqual('new');

    result = await adapter.checkTable(tableName + '_old', '');
    expect(result?.description).toEqual('new');

    result = await adapter.findOne(tableName, {id: 1});

    const expectedResult = {
        id: 1,
        test: 'Hello world!', 
        test2: 1, 
        _lastPosition: null,
    };
    expect(result).toEqual(expectedResult);

    result = await adapter.count(tableName);
    expect(result).toEqual(1);

});

test('JSON handling', async () => {
    let result;

    const schema = {
        id: {
            type: 'Number'
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
    let expectedResult = {'id':1, myJSON: {text:'Hello World!'}, _lastPosition: null};
    expect(result).toEqual(expectedResult);

    result = await adapter.findOne(tableName, {id: 2});
    expectedResult = {'id':2, myJSON: ['Hello', 'World', '!'], _lastPosition: null};
    expect(result).toEqual(expectedResult);

});


test('position check handling', async () => {
    let result;

    const schema = {
        id: {
            type: 'Number'
        },
        name: {
            type: 'String',
        }
    };

    await adapter.dropTable(tableName);

    await adapter.defineTable(tableName, schema);

    // insert with check

    await adapter.insert(tableName, {
        id: 1,
        name: 'Row1',
    }, 1);

    await adapter.insert(tableName, {
        id: 2,
        name: 'Row2',
    }, 2);
    
    result = await adapter.count(tableName);
    expect(result).toEqual(2);

    result = await adapter.findOne(tableName, {id: 1});
    let expectedResult = {'id':1, name: 'Row1', _lastPosition: 1};
    expect(result).toEqual(expectedResult);

    result = await adapter.findOne(tableName, {id: 2});
    expectedResult = {'id':2, name: 'Row2', _lastPosition: 2};
    expect(result).toEqual(expectedResult);

    await adapter.insert(tableName, {
        id: 2,
        name: 'Row2',
    }, 2);

    result = await adapter.count(tableName);
    expect(result).toEqual(2);

    // Find with check

    result = await adapter.find(tableName, null, {position: 2});
    expectedResult = [{'id':1, name: 'Row1', _lastPosition: 1}, {'id':2, name: 'Row2', _lastPosition: 2}];
    expect(result).toEqual(expectedResult);

    const expectedError = new Error('Data not yet availible');
    expectedError.status = 409;
    await expect(adapter.find(tableName, null, {position: 3})).rejects.toThrow(expectedError);

    // Update with check

    result = await adapter.update(tableName, {id: 2}, {
        name: 'Row2 mod',
    }, 2);
    expect(result).toEqual(0);

    result = await adapter.findOne(tableName, {id: 2});
    expectedResult = {'id':2, name: 'Row2', _lastPosition: 2};
    expect(result).toEqual(expectedResult);

    result = await adapter.update(tableName, {id: 2}, {
        name: 'Row2 mod',
    }, 3);
    expect(result).toEqual(1);

    result = await adapter.findOne(tableName, {id: 2});
    expectedResult = {'id':2, name: 'Row2 mod', _lastPosition: 3};
    expect(result).toEqual(expectedResult);

    // Delete with check

    result = await adapter.delete(tableName, {id: 2}, 2);
    expect(result).toEqual(0);

    result = await adapter.findOne(tableName, {id: 2});
    expectedResult = {'id':2, name: 'Row2 mod', _lastPosition: 3};
    expect(result).toEqual(expectedResult);

    result = await adapter.delete(tableName, {id: 2}, 4);
    expect(result).toEqual(1);

    result = await adapter.findOne(tableName, {id: 2});
    expect(result).toEqual(null);

    result = await adapter.findOne(tableName, {id: 1});
    expectedResult = {'id':1, name: 'Row1', _lastPosition: 4};
    expect(result).toEqual(expectedResult);

});
