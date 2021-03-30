const { quoteIdentifier, convertValue, getPositionCheckCondition } = require('./utils');
const { conditionBuilder } = require('./ConditionBuilder');

function updateBuilder(tableName, data, conditions, position = null)
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

    const assignments = fieldNames.map(n => [quoteIdentifier(n), '=', '?'].join(' '));
    const assignmentList = assignments.join(', ');
    const values = fieldNames.map(v => convertValue(data[v]));
    let parameters = [];
    let sql = ['UPDATE', quoteIdentifier(tableName), 'SET', assignmentList].join(' ');
    if(conditions && typeof conditions === 'object')
    {
        const condition = conditionBuilder(conditions);
        sql += [' WHERE', condition.sql].join(' ');
        parameters = parameters.concat(condition.parameters);
    }
    if(position)
    {
        const startString = conditions && typeof conditions === 'object' ? ' AND' : ' WHERE';
        const checkCondition = getPositionCheckCondition(tableName, position);
        sql += [startString, checkCondition[0]].join(' ');
        parameters.push(convertValue(checkCondition[1]));
    }
    return {sql, parameters: values.concat(parameters)};
}

module.exports =  {
    updateBuilder,
};
