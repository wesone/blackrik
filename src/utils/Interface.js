class Interface
{
    constructor(properties)
    {
        if(!properties)
            return;
        Object.entries(properties).forEach(([property, type]) => {
            if(typeof this[property] !== type)
                throw Error(`Property '${property}' needs to be of type '${type}'.`);
        });
    }
}

module.exports = Interface;
