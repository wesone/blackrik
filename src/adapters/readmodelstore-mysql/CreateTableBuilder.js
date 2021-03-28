const crypto = require('crypto');
const { quoteIdentifier } = require('./utils');

const schemaVersion = 1;

const types = {
    'String': 'VARCHAR(512)',
    'Text' : 'TEXT', 
    'JSON' : 'JSON',
    'Boolean': 'TINYINT(1)', 
    'Number': 'DOUBLE',  
    'Date': 'TIMESTAMP', 
    'uuid': 'CHAR(36)'
};

function _validateTypeAttributes(typeDef, attributes, state, fieldIndex)
{
    if(attributes.primaryKey)
    {
        if(fieldIndex !== 0)
        {
            throw new Error('PRIMARY_KEY has to be the first field');
        }
        if(state.hasPrimaryKey)
        {
            throw new Error('Only one PRIMARY_KEY is allowed');
        }
        if(attributes.allowNull)
        {
            throw new Error('PRIMARY_KEY must be defined as NOT NULL');
        }
    }
    if(attributes.defaultValue)
    {
        if(typeDef === 'TEXT' || typeDef === 'BLOB')
        {
            throw new Error('BLOB/TEXT field cannot have a DEFAULT value');
        }
    }
}

function _translateType(type, attributes, state, fieldIndex)
{
    let typeDef = types[type];
    if(!typeDef)
    {
        throw new Error('Unknown type ' + type);
    }
    _validateTypeAttributes(typeDef, attributes, state, fieldIndex);
    
    // TODO: support type length. e.g VARCHAR(10), BIGINT(5,3), ...

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
        typeDef = [typeDef, 'UNIQUE'].join(' ');
    if(attributes.primaryKey)
    {
        state.hasPrimaryKey = true;
        typeDef = [typeDef, 'PRIMARY KEY'].join(' ');
    }
        
    return typeDef;
}

function _calculateHash(fieldTokens)
{
    const hash = crypto.createHash('sha512');
    fieldTokens.forEach(field => hash.update(field));
    return [schemaVersion,hash.digest('hex')].join(':');
}

function createTableBuilder(tableName, fieldDefinitions)
{
    if(typeof fieldDefinitions !== 'object')
    {
        throw new Error('fieldDefinitions has to be an object');
    }

    const fieldNames = Object.keys(fieldDefinitions);

    if(fieldNames.length === 0)
    {
        throw new Error('No Fields defined');
    }

    const state = {};
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
        return [identifier, _translateType(type, {
            allowNull, 
            defaultValue, 
            unique, 
            primaryKey, 
            autoIncrement
        }, state, index)].join(' ');
    });

    const definitions = fieldTokens.join(', ');
    const hash = _calculateHash(fieldTokens);
    const comment = ['COMMENT=','"' , hash, '"'].join('');
    const sql = ['CREATE TABLE', quoteIdentifier(tableName), ['(', definitions, ')'].join(''), comment].join(' ');
    return {sql, hash};
}

module.exports =  {
    createTableBuilder,
};
