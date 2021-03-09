const Interface = require('../utils/Interface');

class EventBusAdapterInterface extends Interface
{
    constructor()
    {
        super({
            subscribe: 'function',
            publish: 'function'
        });
    }
}

module.exports = EventBusAdapterInterface;
