
const identifierPrefix = '`';
const identifierSuffix = '`';

function validateIdentifier(identifier)
{
    if(!identifier)
    {
        throw new Error('identifier "'+identifier+'" is required');
    }
    if(typeof identifier !== 'string')
    {
        throw new Error('identifier "'+identifier+'" has to be a string');
    }
    if(identifier.length < 1 || identifier.length > 64)
    {
        throw new Error('identifier "'+identifier+'" length has to be between 1 and 64 characters');
    }
}

function quoteIdentifier(identifier)
{
    validateIdentifier(identifier);

    if(identifier === '*' || identifier === 'information_schema.TABLES')
        return identifier;
    
    identifier.replace(new RegExp(identifierPrefix, 'g'), '');
    identifier.replace(new RegExp(identifierSuffix, 'g'), '');
    
    return [identifierPrefix, identifier, identifierSuffix].join('');
}

function convertValue(value, arrayToJSON = true)
{
    if(value instanceof Date)
    {
        return value.toISOString().slice(0, 19).replace('T', ' ');
    }
    if(value === undefined || value === null)
    {
        return null;
    }
    if(typeof value === 'object' && !Array.isArray(value))
    {
        return JSON.stringify(value);
    }
    if(arrayToJSON && typeof value === 'object' && Array.isArray(value))
    {
        return JSON.stringify(value);
    }
    // see https://github.com/sidorares/node-mysql2/issues/1239
    //========MySQL 8.0.22 (and higher) fix========
    if(typeof value === 'number')
    {
        return String(value);
    }

    return value;
}

function getPositionCheckCondition(tableName, position)
{
    /*
        COALESCE((SELECT * FROM (SELECT MAX(lastPosition) FROM table) AS maxPosition), -1) < position
        
        The query optimizer does a derived merge optimization for the first subquery (which causes it to fail with the error #1093), 
        but the second subquery doesn't qualify for the derived merge optimization. 
        Hence the optimizer is forced to execute the subquery first.

        See: https://stackoverflow.com/questions/45494/mysql-error-1093-cant-specify-target-table-for-update-in-from-clause
        And: https://dev.mysql.com/doc/refman/8.0/en/update.html
    */
    
    const maxPositionSubQuery = ['SELECT', 'MAX(', quoteIdentifier('lastPosition'), ')', 'FROM', quoteIdentifier(tableName)].join(' ');
    const maxPositionQuery = ['SELECT', '*', 'FROM', '(', maxPositionSubQuery, ')', 'AS', 'maxPosition'].join(' ');
    const condition = ['COALESCE((', maxPositionQuery, '), -1)', '<', '?'].join(' ');
    return [condition, position];
}

module.exports =  {
    validateIdentifier,
    quoteIdentifier,
    convertValue,
    getPositionCheckCondition,
};
