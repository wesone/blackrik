import { quoteIdentifier, convertValue } from './utils';
import { conditionBuilder } from './ConditionBuilder';

function updateBuilder(tableName, data, conditions)
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

    const assignments = fieldNames.map(n => [quoteIdentifier(n), '=', '?'].join(' '));
    const assignmentList = assignments.join(', ');
    const values = fieldNames.map(v => convertValue(data[v]));
    const condition = conditionBuilder(conditions);
    const sql = ['UPDATE', quoteIdentifier(tableName), 'SET', assignmentList, 'WHERE', condition.sql].join(' ');

    return {sql, parameters: values.concat(condition.parameters)};
}

export {
    updateBuilder,
};
