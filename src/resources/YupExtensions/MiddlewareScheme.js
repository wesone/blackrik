const {BaseSchema} = require('yup');

class MiddlewareScheme extends BaseSchema
{
    static create()
    {
        return MiddlewareScheme();
    }

    constructor()
    {
        super({type: 'middleware'});
    }

    _isFunction(value)
    {
        return typeof value === 'function';
    }

    _typeCheck(value)
    {
        if(Array.isArray(value))
        {
            const [path, ...callbacks] = value;
            if(typeof path !== 'string')
                return false;
            return !callbacks.some(callback => !this._isFunction(callback));
        }
        return this._isFunction(value);
    }
}

module.exports = MiddlewareScheme;
