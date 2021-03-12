import { identifierPrefix, identifierSuffix} from './ConditionBuilder';

const types = {
    'String': 'VARCHAR(512)',
    'Text' : 'TEXT', 
    'Boolean': 'TINYINT(1)', 
    'Int': 'INTEGER', 
    'Integer': 'INTEGER', 
    'Bigint': 'BIGINT', 
    'Float': 'FLOAT', 
    'Double': 'DOUBLE', 
    'Decimal': 'DECIMAL(5,2)', 
    'Date': 'DATETIME', 
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
    if(attributes.autoIncrement)
    {
        if(typeDef !== 'INTEGER' && typeDef !== 'FLOAT')
        {
            throw new Error('Only Integer or Float field can have the AUTO_INCREMENT attribute');
        }
        if(state.hasAutoIncrement)
        {
            throw new Error('Only one AUTO_INCREMENT is allowed');
        }

        if(!attributes.primaryKey && !attributes.unique)
        {
            throw new Error('AUTO_INCREMENT field must be indexed');
        }
        if(attributes.defaultValue)
        {
            throw new Error('AUTO_INCREMENT field cannot have a DEFAULT value');
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
    if(attributes.autoIncrement)
    {
        state.hasAutoIncrement = true;
        typeDef = [typeDef, 'AUTO_INCREMENT'].join(' ');
    }
        
    return typeDef;
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
        } = fieldDefinitions[name];
        if(!type)
        {
            throw new Error('No type given for field: ' + name);
        }
        
        const identifier = [identifierPrefix, name, identifierSuffix].join(''); 
        return [identifier, _translateType(type, {
            allowNull, 
            defaultValue, 
            unique, 
            primaryKey, 
            autoIncrement
        }, state, index)].join(' ');
    });
    const definitions = fieldTokens.join(', ');
    return ['CREATE TABLE', tableName, ['(', definitions, ')'].join('')].join(' ');
}

export {
    createTableBuilder,
};
