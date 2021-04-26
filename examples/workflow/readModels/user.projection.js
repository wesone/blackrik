const {
    USER_CREATED,
    USER_UPDATED,
    USER_REJECTED
} = require('../events/users');

const tableName = 'Users';

module.exports = {
    init: async store => {
        await store.defineTable(tableName, {
            id: {
                type: 'uuid',
                primaryKey: true,
            },
            email: 'string',
            name: 'string',
            createdAt: 'date',
            updatedAt: 'date'
        });
    },
    [USER_CREATED]: async (store, event) => {
        const createdAt = new Date(event.timestamp);
        await store.insert(tableName, {
            id: event.aggregateId,
            email: event.payload.email,
            name: event.payload.name,
            createdAt,
            updatedAt: createdAt
        });
    },
    [USER_UPDATED]: async (store, event) => {
        await store.update(tableName, {
            id: event.aggregateId
        }, {
            email: event.payload.email,
            updatedAt: new Date(event.timestamp)
        });
    },
    [USER_REJECTED]: async (store, {aggregateId: id}) => {
        await store.delete(tableName, {id});
    }
};
