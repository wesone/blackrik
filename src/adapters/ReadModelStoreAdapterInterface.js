const Interface = require('../utils/Interface');

class ReadModelStoreAdapterInterface extends Interface
{
    constructor()
    {
        super({
            defineTable: 'function',
            dropTable: 'function',
            insert: 'function',
            update: 'function',
            find: 'function',
            findOne: 'function',
            count: 'function',
            delete: 'function',
            beginTransaction: 'function',
            commit: 'function',
            rollback: 'function',
            close: 'function'
        });
    }
}

module.exports = ReadModelStoreAdapterInterface;
