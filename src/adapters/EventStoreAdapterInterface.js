const Interface = require('../utils/Interface');

class EventStoreAdapterInterface extends Interface
{
    constructor()
    {
        super({
            init: 'function',
            save: 'function',
            load: 'function'
        });
    }
}

module.exports = EventStoreAdapterInterface;
