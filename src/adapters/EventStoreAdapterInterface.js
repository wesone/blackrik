const Interface = require('../utils/Interface');

class EventStoreAdapterInterface extends Interface
{
    constructor()
    {
        super({
            init: 'function',
            save: 'function',
            load: 'function',
            delete: 'function',
            close: 'function'
        });
    }
}

module.exports = EventStoreAdapterInterface;
