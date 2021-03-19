
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

function convertValue(value)
{
    if(value instanceof Date)
    {
        return value.toISOString().slice(0, 19).replace('T', ' ');
    }
    if(value === undefined)
    {
        return null;
    }
    // see https://github.com/sidorares/node-mysql2/issues/1239
    //========MySQL 8.0.22 (and higher) fix========
    if(typeof value === 'number')
    {
        return String(value);
    }
      
    return value;
}

module.exports =  {
    validateIdentifier,
    quoteIdentifier,
    convertValue,
};
