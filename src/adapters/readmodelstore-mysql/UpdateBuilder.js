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
        data.lastPosition = position;
        fieldNames.push('lastPosition');
    }

    const assignments = fieldNames.map(n => [quoteIdentifier(n), '=', '?'].join(' '));
    const assignmentList = assignments.join(', ');
    const values = fieldNames.map(v => convertValue(data[v]));
    const condition = conditionBuilder(conditions);
    let sql = ['UPDATE', quoteIdentifier(tableName), 'SET', assignmentList, 'WHERE', condition.sql].join(' ');
    if(position)
    {
        const checkCondition = getPositionCheckCondition(tableName, position);
        sql += [' AND', checkCondition[0]].join(' ');
        condition.parameters.push(convertValue(checkCondition[1]));
    }
    return {sql, parameters: values.concat(condition.parameters)};
}
// COALESCE((SELECT * FROM (SELECT MAX(lastPosition) FROM users) as maxPosition), -1) < 282440
module.exports =  {
    updateBuilder,
};
