const { quoteIdentifier } = require('./utils');
const { conditionBuilder } = require('./ConditionBuilder');

function selectBuilder(tableName, queryOptions)
{
    if(typeof queryOptions !== 'object')
    {
        throw new Error('queryOptions has to be an object');
    }

    let selectList = quoteIdentifier('*');
    if(queryOptions.count)
    {
        selectList = ['COUNT(', selectList, ')', ' AS cnt'].join('');
    }
    else if(queryOptions.fields)
    {
        selectList = queryOptions.fields.map(field => quoteIdentifier(field)).join(', ');
    }

    const distinct = !!queryOptions.distinct;

    const sqlList = [distinct ? 'SELECT DISTINCT' : 'SELECT', selectList, 'FROM', quoteIdentifier(tableName)];
    const parameters = [];

    if(queryOptions.conditions)
    {
        const condition = conditionBuilder(queryOptions.conditions);
        sqlList.push('WHERE', condition.sql);
        parameters.push(...condition.parameters);
    } 
    
    if(queryOptions.group)
    {
        const group = queryOptions.group.map(field => quoteIdentifier(field)).join(', ');
        sqlList.push('GROUP BY', group);
    }

    if(queryOptions.sort)
    {
        const sort = Object.keys(queryOptions.sort).map(field => {
            const direction = queryOptions.sort[field];
            if(direction !== 1 && direction !== -1)
            {
                throw new Error('direction of sort has to be 1 for ASC or -1 for DESC');
            }
            return [quoteIdentifier(field), direction === 1 ? 'ASC' : 'DESC'].join(' ');
        }).join(', ');
        sqlList.push('ORDER BY', sort);
    }

    if(queryOptions.limit)
    {
        if(typeof queryOptions.limit !== 'number')
        {
            throw new Error('limit has to be a number');
        }
        sqlList.push('LIMIT', '?');
        parameters.push(queryOptions.limit);
    }

    if(queryOptions.offset)
    {
        if(typeof queryOptions.offset !== 'number')
        {
            throw new Error('offset has to be a number');
        }
        sqlList.push('OFFSET', '?');
        parameters.push(queryOptions.offset);
    }

    return {sql: sqlList.join(' '), parameters};
}

module.exports =  {
    selectBuilder,
};
