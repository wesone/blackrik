const { quoteIdentifier, convertValue } = require('./utils');

const comparisonOperators = {
    $eq: '=',
    $ne: '!=',
    $gt: '>',
    $gte: '>=',
    $lt: '<',
    $lte: '<=',
    $is: 'IS',
    $isNot: 'IS NOT',
    $like: 'LIKE',
    $in: 'IN'
};

const logicalOperators = {
    '$and' : 'AND',
    '$or' : 'OR',
    '$not' : 'AND',
    '$nor' : 'OR',
};

const _typeOperators = (operators, type) => {
    const res = {};
    Object.keys(operators).map(k => res[k] = {o: k, t: type, op: operators[k]});
    return res;
};

const allOperators = {
    ..._typeOperators(comparisonOperators, 'comparison'), 
    ..._typeOperators(logicalOperators, 'logical')
};

function _buildAST(conditions)
{
    if(typeof conditions !== 'object' || Array.isArray(conditions))
        throw new Error('Object expected');

    const keys = Object.keys(conditions);
    const ast = keys.map(field => {
        return {..._tokenizer(conditions[field], field)[0], field};
    });
    return ast;
}

function _tokenizer(condition, field)
{
    if(Array.isArray(condition))
    {
        const token = allOperators[field];
        if(!token || token.t !== 'logical')
            throw new Error('Logical operator expected');

        return [{
            ...token,
            value: condition.map(c => ({..._buildAST(c)[0]}))
        }];
    }
    if(typeof condition === 'string' || typeof condition === 'number' || condition instanceof Date || condition === null)
    {
        return [{
            ...allOperators['$eq'],
            value: condition,
        }];
    }
    return Object.keys(condition).map(operator => {
        const token = allOperators[operator];
        if(!token)
            throw new Error('Unknown operator ' + operator);

        const value = condition[operator];

        if(token.t === 'logical' && field && Array.isArray(value))
            throw new Error('Unexpected logical operator ' + token.o);

        if(token.t === 'logical' && typeof value === 'object')
        {
            return {
                ...token,
                value : _tokenizer(value),
            };
        }

        return {
            ...token,
            value,
        };
    });
}

// Named parameters are not supported by MySQL prepare statements
/*
function _pushParameter(value, parameters)
{
    const count = Object.keys(parameters).length;
    const name = ['p', count + 1].join('');
    parameters[name] = value;
    return '?' + name;
}
*/

function _pushParameter(value, parameters)
{
    parameters.push(value);
    return '?';
}

function _sqlBuilder(ast, field, parameters )
{
    if(!Array.isArray(ast))
    {
        ast = [ast];
    }
    let sql = '';
    let res = '';
    for(const token of ast)
    {
        if(token.t === 'comparison')
        {
            let value = token.value;
            const operator = token.op;
            let raw;

            value = convertValue(value, false);
            if(value === null)
            {
                if(token.o === '$eq' || token.o === '$is')
                    raw = 'IS NULL';
                else if(token.o === '$ne' || token.o === '$isNot')
                    raw = 'IS NOT NULL';
            }
            else if(Array.isArray(value) && token.o === '$in')
            {
                const parameterNames = value.map(v => _pushParameter(v, parameters));
                raw = ['IN ', '(', parameterNames.join(', '),')'].join('');
            } 
            
            const identifier = quoteIdentifier(token.field ?? field);
            if(raw)
                res = [identifier, raw].join(' ');
            else 
            {
                const parameterName = _pushParameter(value, parameters);
                res = [identifier, operator, parameterName].join(' ');
            }
        } 
        else if(token.t === 'logical')
        {
            if(!Array.isArray(token.value) || !token.value.length)
                break;

            res = token.value.map(v => _sqlBuilder(v, token.field ?? field, parameters)).join(' ' + token.op + ' ');
            if(token.value.length > 1) 
                res = '(' + res + ')';
                
            if(token.o === '$not' || token.o === '$nor')
                res = 'NOT ' + res;
        }
        if(sql.length > 0)
            sql = [sql, res].join(' AND ');
        else 
            sql = res;
    }
    return sql;
}

function conditionBuilder(conditions)
{
    const ast = _buildAST(conditions);
    const parameters = [];
    const sql = _sqlBuilder(ast, null, parameters);
    return {sql, parameters};
}

module.exports =  {
    conditionBuilder,
};
