const {BaseSchema} = require('yup');

class AdapterListScheme extends BaseSchema
{
    static create()
    {
        return MiddlewareScheme();
    }

    constructor()
    {
        super({type: 'adapter-list'});
    }

    _isObject(value)
    {
        return Object.prototype.toString.call(value) === '[object Object]';
    }

    _isAdapter(value)
    {
        if(
            !Object.prototype.hasOwnProperty.call(value, 'module') || typeof value.module !== 'string' ||
            Object.prototype.hasOwnProperty.call(value, 'args') && !this._isObject(value.args)
        )
            return false;
        return true;
    }

    _typeCheck(value)
    {
        if(!this._isObject(value))
            return false;
        return Object.values(value).every(this._isAdapter.bind(this))
    }
}

module.exports = AdapterListScheme;
