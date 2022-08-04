const Interface = require('../utils/Interface');

class EventBusAdapterInterface extends Interface
{
    constructor()
    {
        super({
            init: 'function',
            start: 'function',
            stop: 'function',
            subscribe: 'function',
            publish: 'function',
            delete: 'function'
        });
    }
}

module.exports = EventBusAdapterInterface;
