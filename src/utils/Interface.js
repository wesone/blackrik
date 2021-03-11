class Interface
{
    constructor(properties)
    {
        if(!properties)
            return;
        Object.entries(properties).forEach(([property, type]) => {
            if(typeof this[property] !== type)
                throw Error(`Add property '${property}' (type '${type}').`);
        });
    }
}

module.exports = Interface;
