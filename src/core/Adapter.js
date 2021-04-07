class Adapter
{
    static create(config)
    {
        if(!config)
            return null;
        const {module, args} = config;
        try
        {
            const create = require(module);
            if(typeof create !== 'function')
                return null;
            return create(args);
        }
        catch(e)
        {
            console.error('Could not create adapter.', e);
            return null;
        }
    }
}

module.exports = Adapter;
