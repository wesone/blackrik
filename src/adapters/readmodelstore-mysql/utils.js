
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
    
    if(identifier === '*')
        return identifier;
    
    identifier.replace(new RegExp(identifierPrefix, 'g'), '');
    identifier.replace(new RegExp(identifierSuffix, 'g'), '');
    
    return [identifierPrefix, identifier, identifierSuffix].join('');
}

function convertValue(value)
{
    if(value instanceof Date)
    {
        return value.toISOString();
    }
    if(value === undefined)
    {
        return null;
    }
    return value;
}

export {
    validateIdentifier,
    quoteIdentifier,
    convertValue,
};
