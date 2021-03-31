const { quoteIdentifier, convertValue } = require('./utils');
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

    if(queryOptions.conditions && ((Array.isArray(queryOptions.conditions) && queryOptions.conditions.length > 0) || 
        Object.keys(queryOptions.conditions).length > 0))
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
        if(!Array.isArray(queryOptions.sort))
        {
            throw new Error('Array expected for sort queryOption');
        }
        let sort = [];
        for(let sortObject of queryOptions.sort)
        {
            if(Array.isArray(sortObject))
            {
                if(sortObject.length !== 2)
                {
                    throw new Error('Sort array needs 2 elements. [field, order]');
                }
                sortObject = {[sortObject[0]] : sortObject[1]};
            }
            const keys = Object.keys(sortObject);
            if(!keys || keys.length === 0)
            {
                throw new Error('Sort object cannot be empty. Needs: {field: order}');
            }
            const partSort = keys.map(field => {
                const direction = sortObject[field];
                if(direction !== 1 && direction !== -1)
                {
                    throw new Error('direction of sort has to be 1 for ASC or -1 for DESC');
                }
                return [quoteIdentifier(field), direction === 1 ? 'ASC' : 'DESC'].join(' ');
            });
            sort = sort.concat(partSort);
        }
        sqlList.push('ORDER BY', sort.join(', '));
    }

    if(queryOptions.limit)
    {
        if(typeof queryOptions.limit !== 'number')
        {
            throw new Error('limit has to be a number');
        }
        sqlList.push('LIMIT', '?');
        parameters.push(convertValue(queryOptions.limit));
    }

    if(queryOptions.offset)
    {
        if(typeof queryOptions.offset !== 'number')
        {
            throw new Error('offset has to be a number');
        }
        sqlList.push('OFFSET', '?');
        parameters.push(convertValue(queryOptions.offset));
    }

    return {sql: sqlList.join(' '), parameters};
}

module.exports =  {
    selectBuilder,
};
