const crypto = require('crypto');
const { quoteIdentifier } = require('./utils');

const schemaVersion = 1;

const types = {
    'string': 'VARCHAR(512)',
    'text' : 'TEXT', 
    'json' : 'JSON',
    'boolean': 'TINYINT(1)', 
    'number': 'DOUBLE',  
    'date': 'TIMESTAMP', 
    'uuid': 'CHAR(36)'
};

const TYPE_REGEX = /(?<type>\w+)(?:\((?<length>\d+)\))*/;

function _validateTypeAttributes(typeDef, attributes, type, length)
{
    if(length && typeDef !== types['string'])
    {
        throw new Error(`Invalid type: "${type}". Type length only supported for "string"`);
    }
    if(attributes.defaultValue)
    {
        if(typeDef === 'TEXT' || typeDef === 'BLOB')
        {
            throw new Error('BLOB/TEXT field cannot have a DEFAULT value');
        }
    }
}

function _validateFieldIndex(attributes, isPrimaryKey)
{
    if(isPrimaryKey)
    {
        if(attributes.allowNull)
        {
            throw new Error('PRIMARY_KEY must be defined as NOT NULL');
        }
    }
}

function _translateType(field, type, attributes, state, fieldIndex, fieldDefinitions)
{
    const match = TYPE_REGEX.exec(type);
    let typeDef = types[match?.groups?.type?.toLowerCase()];
    const typeLength = match?.groups?.length;
    
    if(!typeDef)
    {
        throw new Error('Unknown type ' + type);
    }
    _validateTypeAttributes(typeDef, attributes, type, typeLength);
    
    if(typeLength && typeDef === types['string'])
    {
        typeDef = `VARCHAR(${typeLength})`;
    }

    if(attributes.allowNull) 
        typeDef = [typeDef, 'NULL'].join(' ');
    if(attributes.defaultValue)
    {
        let defaultValue = attributes.defaultValue;
        if(typeof defaultValue === 'string')
            defaultValue = ['\'', defaultValue, '\''].join('');
        typeDef = [typeDef, 'DEFAULT', defaultValue].join(' ');
    }
    if(attributes.unique)
        _addIndex({fields: [field], unique: true}, state, fieldDefinitions);
    if(attributes.primaryKey)
        _addIndex({fields: [field], primaryKey: true}, state, fieldDefinitions);
    return typeDef;
}

function _translateIndexType(indexDef, name)
{
    if(indexDef.primaryKey)
        return 'PRIMARY KEY';
    return [indexDef.unique ? 'UNIQUE KEY': 'KEY', quoteIdentifier(name)].join(' ');
}

function _addIndex(indexDef, state, fieldDefinitions)
{
    if(indexDef.primaryKey && state.indexes.PRIMARY)
    {
        throw new Error('Primary Key is already defined.');
    }
    if(Object.keys(state.indexes).length >= 16)
    {
        throw new Error('Tried to add more then 16 indexes');
    }
    if(!indexDef.fields || !Array.isArray(indexDef.fields) || indexDef.fields.length === 0)
    {
        throw new Error('Index need fields');
    }
    indexDef.fields.forEach(field => {
        const definition = fieldDefinitions[field];
        if(!definition)
        {
            throw new Error(`Unknown field '${field}' for index`);
        }
        _validateFieldIndex(definition, indexDef.primaryKey);
    });
    let name = indexDef.name;
    if(indexDef.primaryKey)
    {
        name = 'PRIMARY';
    }
    else if(!indexDef.name)
    {
        name = ['index',Object.keys(state.indexes).length].join('_');
    }
    const keyParts = indexDef.fields.map(quoteIdentifier).join(', ');
    state.indexes[name] = [_translateIndexType(indexDef, name), '(', keyParts, ')'].join(' ');
}
    
function _getIndexTokens(state)
{
    return Object.values(state.indexes).sort((tokenA,tokenB) => {
        const a = tokenA.startsWith('PRIMARY') ? 3 : (tokenA.startsWith('UNIQUE') ? 2 : 1);
        const b = tokenB.startsWith('PRIMARY') ? 3 : (tokenB.startsWith('UNIQUE') ? 2 : 1);
        return b - a;
    });
}

function _calculateHash(fieldTokens)
{
    const hash = crypto.createHash('sha512');
    fieldTokens.forEach(field => hash.update(field));
    return [schemaVersion,hash.digest('hex')].join(':');
}

function createTableBuilder(tableName, fieldDefinitions, indexes)
{

    /*

const indexes = [
        {fields: ['id', 'test'], primaryKey: true},
        {fields: ['id', 'test', 'testDate'], unique: true},
        {fields: ['testInt', 'testInc'], name: 'myIndex'},
    ];
    */

    if(typeof fieldDefinitions !== 'object')
    {
        throw new Error('fieldDefinitions has to be an object');
    }

    const fieldNames = Object.keys(fieldDefinitions);

    if(fieldNames.length === 0)
    {
        throw new Error('No Fields defined');
    }

    fieldNames.sort(fieldName => fieldDefinitions[fieldName].primaryKey ? -1 : 1);

    const state = {
        indexes: {},
    };
    const fieldTokens = fieldNames.map((name, index) => {
        const {
            type, 
            allowNull, 
            defaultValue, 
            unique, 
            primaryKey, 
            autoIncrement
        } = typeof fieldDefinitions[name] === 'object' ? 
            fieldDefinitions[name] : {type: fieldDefinitions[name]};
        if(!type)
        {
            throw new Error('No type given for field: ' + name);
        }
        
        const identifier = quoteIdentifier(name); 
        return [identifier, _translateType(name, type, {
            allowNull, 
            defaultValue, 
            unique, 
            primaryKey, 
            autoIncrement
        }, state, index, fieldDefinitions)].join(' ');
    });

    if(indexes && Array.isArray(indexes))
    {
        indexes.forEach(indexDef => _addIndex(indexDef, state, fieldDefinitions));
    }
    fieldTokens.push(..._getIndexTokens(state));

    const definitions = fieldTokens.join(', ');
    const hash = _calculateHash(fieldTokens);
    const comment = ['COMMENT=','"' , hash, '"'].join('');
    const sql = ['CREATE TABLE', quoteIdentifier(tableName), ['(', definitions, ')'].join(''), comment].join(' ');
    return {sql, hash};
}

module.exports =  {
    createTableBuilder,
};
