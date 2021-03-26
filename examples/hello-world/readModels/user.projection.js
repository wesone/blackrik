const {
    USER_CREATED,
    USER_UPDATED
} = require('../events/users');

const tableName = 'users';

module.exports = {
    init: async store => {
        await store.defineTable(tableName, {
            id: {
                type: 'uuid',
                primaryKey: true,
            },
            name: 'String',
            createdAt: 'Date',
            updatedAt: 'Date'
        });
    },
    [USER_CREATED]: async (store, event) => {
        //console.log('ReadModel projection executed', event.payload.name, event.position);
        const createdAt = new Date(event.timestamp);
        await store.insert(tableName, {id: event.aggregateId, name: event.payload.name, createdAt, updatedAt: createdAt});
    },
    [USER_UPDATED]: async (store, event) => {
        //console.log('ReadModel projection executed', event.payload.name, event.position);
        await store.update(tableName, {id: event.aggregateId}, {name: event.payload.name, updatedAt: new Date(event.timestamp)});
    }
};
