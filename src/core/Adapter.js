class Adapter
{
    static create(config)
    {
        if(!config)
            return null;
        const {module, args} = config;
        const create = require(module);
        if(typeof create === 'function')
            return create(args);
        return null;
    }
}

module.exports = Adapter;
