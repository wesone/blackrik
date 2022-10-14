const {quoteIdentifier, convertValue, getPositionCheckCondition} = require('./utils');
const {conditionBuilder} = require('./ConditionBuilder');

function updateBuilder(tableName, data, conditions, meta = null)
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

    if(meta !== null)
    {
        data._lastPosition = meta.position;
        fieldNames.push('_lastPosition');
        data._operation = meta.operation;
        fieldNames.push('_operation');
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
    if(meta)
    {
        const startString = conditions && typeof conditions === 'object' ? ' AND' : ' WHERE';
        const checkCondition = getPositionCheckCondition(tableName, meta);
        sql += [startString, checkCondition[0]].join(' ');
        parameters.push(...checkCondition[1].map(p => convertValue(p)));
    }
    return {sql, parameters: values.concat(parameters)};
}

module.exports = {
    updateBuilder,
};
