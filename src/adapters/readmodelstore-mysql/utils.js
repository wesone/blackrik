
const identifierPrefix = '`';
const identifierSuffix = '`';

function quoteIdentifier(identifier)
{
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
    quoteIdentifier,
    convertValue,
};
