const { quoteIdentifier, convertValue } = require('./utils');

function insertIntoBuilder(tableName, data, position = null)
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

    if(position !== null)
    {
        data._lastPosition = position;
        fieldNames.push('_lastPosition');
    }

    const parameters = fieldNames.map(name => convertValue(data[name]));
    const fieldList = ['(', fieldNames.map(n => quoteIdentifier(n)).join(', '), ')'].join('');

    if(position === null)
    {
        const valueList = ['(', parameters.map(() => '?').join(', ') ,')'].join('');
        const sql = ['INSERT INTO', quoteIdentifier(tableName), fieldList, 'VALUES', valueList].join(' ');
        return {sql, parameters};
    }
    
    const valueList = [parameters.map(() => '?').join(', ')].join('');
    const subQuery = ['SELECT', 'MAX(', quoteIdentifier('_lastPosition'), ')', 'FROM', quoteIdentifier(tableName)].join(' ');
    const sql = ['INSERT INTO', quoteIdentifier(tableName), fieldList, 'SELECT', valueList, 'WHERE', '?', '>', 'COALESCE((', subQuery, '),-1)'].join(' ');
    parameters.push(convertValue(position));
    return {sql, parameters};
}

module.exports =  {
    insertIntoBuilder,
};
