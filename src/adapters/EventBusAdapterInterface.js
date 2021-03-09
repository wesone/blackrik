const Interface = require('../utils/Interface');

class EventBusAdapterInterface extends Interface
{
    constructor()
    {
        super({
            init: 'function',
            subscribe: 'function',
            publish: 'function'
        });
    }
}

module.exports = EventBusAdapterInterface;
