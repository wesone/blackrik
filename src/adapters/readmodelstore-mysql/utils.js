
const identifierPrefix = '`';
const identifierSuffix = '`';

function escapeIdentifier(identifier)
{
    return [identifierPrefix, identifier, identifierSuffix].join('');
}

export {
    escapeIdentifier,
};
