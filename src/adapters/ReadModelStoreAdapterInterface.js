const Interface = require('../utils/Interface');

class ReadModelStoreAdapterInterface extends Interface
{
    constructor()
    {
        super({
            createTable: 'function',
            dropTable: 'function',
            insert: 'function',
            update: 'function',
            find: 'function',
            findOne: 'function',
            count: 'function',
            delete: 'function'
        });
    }
}

module.exports = ReadModelStoreAdapterInterface;
