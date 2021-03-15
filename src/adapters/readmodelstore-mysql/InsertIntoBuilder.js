import { quoteIdentifier, convertValue } from './utils';

function insertIntoBuilder(tableName, data)
{
    if(typeof data !== 'object')
    {
        throw new Error('data has to be an object');
    }

    const fieldNames = Object.keys(data);

    if(fieldNames.length === 0)
    {
        throw new Error('No Fields given');
    }

    const fieldList = ['(', fieldNames.map(n => quoteIdentifier(n)).join(', '), ')'].join('');

    const parameters = fieldNames.map(name => convertValue(data[name]));
    const valueList = ['(', parameters.map(() => '?').join(', ') ,')'].join('');
    
    const sql = ['INSERT INTO', quoteIdentifier(tableName), fieldList, 'VALUES', valueList].join(' ');

    return {sql, parameters};
}

export {
    insertIntoBuilder,
};
