const {USER_CREATED} = require('../events/users');

const tableName = 'users';

module.exports = {
    init: async store => {
        await store.defineTable(tableName, {
            id: {
                type: 'uuid',
                primaryKey: true,
            },
            name: {
                type: 'String'
            },
            lastPosition: {
                type: 'Bigint',
                unique: true,
            },
            createdAt: {
                type: 'Date'
            },
        });
    },
    [USER_CREATED]: async (store, event) => {
        console.log('ReadModel projection executed', event);
        await store.insert(tableName, {id: event.aggregateId ,name: event.payload.name, lastPosition: event.position, createdAt: new Date(event.timestamp)});
    }
};
