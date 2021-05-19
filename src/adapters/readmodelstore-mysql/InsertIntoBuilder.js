const { quoteIdentifier, convertValue } = require('./utils');

function insertIntoBuilder(tableName, data, meta = null)
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

    if(meta !== null)
    {
        data._lastPosition = meta.position;
        fieldNames.push('_lastPosition');
        data._operation = meta.operation;
        fieldNames.push('_operation');
    }

    const parameters = fieldNames.map(name => convertValue(data[name]));
    const fieldList = ['(', fieldNames.map(n => quoteIdentifier(n)).join(', '), ')'].join('');

    if(meta === null)
    {
        const valueList = ['(', parameters.map(() => '?').join(', ') ,')'].join('');
        const sql = ['INSERT INTO', quoteIdentifier(tableName), fieldList, 'VALUES', valueList].join(' ');
        return {sql, parameters};
    }
    
    const valueList = [parameters.map(() => '?').join(', ')].join('');
    const subQueryPos = ['SELECT', 'MAX(', quoteIdentifier('_lastPosition'), ')', 'FROM', quoteIdentifier(tableName)].join(' ');
    const subQueryOp = ['SELECT', 'MAX(',quoteIdentifier('_operation'), ') AS', quoteIdentifier('_maxOp'), ',', quoteIdentifier('_lastPosition'), 
        'FROM', quoteIdentifier(tableName), 
        'GROUP BY', quoteIdentifier('_lastPosition'), 
        'HAVING', quoteIdentifier('_lastPosition'), '=', '?', 'AND', '?','>', quoteIdentifier('_maxOp')].join(' ');
    const sql = ['INSERT INTO', quoteIdentifier(tableName), fieldList, 'SELECT', valueList, 'WHERE', '?', '>', 'COALESCE((', subQueryPos, '),-1)', 'OR', 'EXISTS', '(', subQueryOp, ')'].join(' ');
    parameters.push(convertValue(meta.position), convertValue(meta.position), convertValue(meta.operation));
    return {sql, parameters};
}

module.exports =  {
    insertIntoBuilder,
};
