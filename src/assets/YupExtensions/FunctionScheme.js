const {BaseSchema} = require('yup');

class FunctionScheme extends BaseSchema
{
    static create()
    {
        return FunctionScheme();
    }

    constructor()
    {
        super({type: 'function'});
    }

    _typeCheck(value)
    {
        return typeof value === 'function';
    }
}

module.exports = FunctionScheme;
