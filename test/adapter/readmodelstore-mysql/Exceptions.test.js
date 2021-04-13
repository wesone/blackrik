import Adapter from '../../../src/adapters/readmodelstore-mysql/Adapter';
import { conditionBuilder } from '../../../src/adapters/readmodelstore-mysql/ConditionBuilder';
import { createTableBuilder } from '../../../src/adapters/readmodelstore-mysql/CreateTableBuilder';
import { insertIntoBuilder } from '../../../src/adapters/readmodelstore-mysql/InsertIntoBuilder';
import { selectBuilder } from '../../../src/adapters/readmodelstore-mysql/SelectBuilder';
import { updateBuilder } from '../../../src/adapters/readmodelstore-mysql/UpdateBuilder';
import { quoteIdentifier } from '../../../src/adapters/readmodelstore-mysql/utils';
const tableName = 'TestTable';



test('no tableName', async () => {
    const expectedError =  new Error('Readmodelstore needs a database name.');
    expect(() => new Adapter({})).toThrow(expectedError);
});

test('try to insert reserved fields', async () => {
    const adapter = new Adapter({database: 'AdapterTest'});
    const expectedError =  new Error('_lastPosition is a reserved field name.');
    await expect(adapter.defineTable(tableName, {_lastPosition: 'String'})).rejects.toThrow(expectedError);
});

test('test transaction exceptions', async () => {
    const adapter = new Adapter({database: 'AdapterTest'});
    let expectedError =  new Error('Can only be used in a transaction');
    await expect(adapter.commit()).rejects.toThrow(expectedError);
    await expect(adapter.rollback()).rejects.toThrow(expectedError);

    adapter.isTransaction = true;
    expectedError =  new Error('Transaction already started');
    await expect(adapter.beginTransaction()).rejects.toThrow(expectedError);
});

test('test fieldAttribute exceptions', async () => {
    expect(() => createTableBuilder(tableName, 1234)).toThrow(new Error('fieldDefinitions has to be an object'));
    expect(() => createTableBuilder(tableName, '1234')).toThrow(new Error('fieldDefinitions has to be an object'));
    expect(() => createTableBuilder(tableName)).toThrow(new Error('fieldDefinitions has to be an object'));

    expect(() => createTableBuilder(tableName, {})).toThrow(new Error('No Fields defined'));

    expect(() => createTableBuilder(tableName, {asd: {type: 'Number', defaultValue: 1234}, fail: {}})).toThrow(new Error('No type given for field: fail'));

    expect(() => createTableBuilder(tableName, {
        asd: {
            type: 'String',
            primaryKey: true,
        }, 
        fail: {
            type: 'String',
            primaryKey: true,
        }})).toThrow(new Error('Primary Key is already defined.'));  

    expect(() => createTableBuilder(tableName, {
        fail: {
            type: 'String',
            primaryKey: true,
            allowNull: true,
        }})).toThrow(new Error('PRIMARY_KEY must be defined as NOT NULL'));  

    expect(() => createTableBuilder(tableName, {
        fail: {
            type: 'Text',
            defaultValue: 'MyDefaultValue',
        }
    })).toThrow(new Error('BLOB/TEXT field cannot have a DEFAULT value'));  


    expect(() => createTableBuilder(tableName, {
        fail: {
            type: 'MyCustomType',
        }
    })).toThrow(new Error('Unknown type MyCustomType'));  

});

test('test condition exceptions', async () => {
    expect(() => conditionBuilder()).toThrow(new Error('Object expected'));
    expect(() => conditionBuilder(1234)).toThrow(new Error('Object expected'));

    expect(() => conditionBuilder({$gt: []})).toThrow(new Error('Logical operator expected'));

    expect(() => conditionBuilder({asd: {$fail : 1234}})).toThrow(new Error('Unknown operator $fail'));
    expect(() => conditionBuilder({asd: {$and : []}})).toThrow(new Error('Unexpected logical operator $and'));
});

test('test insert exceptions', async () => {
    expect(() => insertIntoBuilder(tableName, 1234)).toThrow(new Error('data has to be an object'));
    expect(() => insertIntoBuilder(tableName, {})).toThrow(new Error('No Fields given'));
});

test('test select exceptions', async () => {
    expect(() => selectBuilder(tableName, 1234)).toThrow(new Error('queryOptions has to be an object'));
    expect(() => selectBuilder(tableName, {
        sort: 1234
    })).toThrow(new Error('Array expected for sort queryOption'));
    expect(() => selectBuilder(tableName, {
        sort: [['asd']]
    })).toThrow(new Error('Sort array needs 2 elements. [field, order]'));
    expect(() => selectBuilder(tableName, {
        sort: [{}]
    })).toThrow(new Error('Sort object cannot be empty. Needs: {field: order}'));
    expect(() => selectBuilder(tableName, {
        sort: [{asd: 'asd'}]
    })).toThrow();

    expect(() => selectBuilder(tableName, {
        limit: 'one'
    })).toThrow(new Error('limit has to be a number'));

    expect(() => selectBuilder(tableName, {
        conditions: [],
        offset: 'one'
    })).toThrow(new Error('offset has to be a number'));
});

test('test update exceptions', async () => {
    expect(() => updateBuilder(tableName, 1234)).toThrow(new Error('data has to be an object'));
    expect(() => updateBuilder(tableName, {})).toThrow(new Error('No Fields given'));
});

test('test identifier exceptions', async () => {
    expect(() => quoteIdentifier()).toThrow(new Error('identifier is required'));
    expect(() => quoteIdentifier(1234)).toThrow(new Error('identifier "1234" has to be a string'));
    expect(() => quoteIdentifier('asdasdasdvasdasdasdvasdasdasdvasdasdasdvasdasdasdvasdasdasdv12345')).
        toThrow(new Error('identifier "asdasdasdvasdasdasdvasdasdasdvasdasdasdvasdasdasdvasdasdasdv12345" length has to be between 1 and 64 characters'));
});
