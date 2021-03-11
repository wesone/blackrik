const Interface = require('../utils/Interface');

class EventStoreAdapterInterface extends Interface
{
    constructor()
    {
        super({
            save: 'function',
            load: 'function'
        });
    }
}

module.exports = EventStoreAdapterInterface;
