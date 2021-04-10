const {
    USER_REGISTERED,
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
            email: 'String',
            name: 'String',
            password: 'String',
            createdAt: 'Date',
            updatedAt: 'Date'
        });
    },
    [USER_REGISTERED]: async (store, event) => {
        const {
            aggregateId: id,
            timestamp,
            payload: {
                email,
                name,
                password
            }
        } = event;
        const createdAt = new Date(timestamp);
        await store.insert(tableName, {
            id,
            email,
            name,
            password,
            createdAt,
            updatedAt: createdAt
        });
    },
    [USER_UPDATED]: async (store, {aggregateId: id, timestamp, payload: {name, password}}) => {
        const updates = {updatedAt: new Date(timestamp)};
        if(name)
            updates.name = name;
        if(password)
            updates.password = password;
        await store.update(tableName, {id}, updates);
    },
    [USER_REJECTED]: async (store, {aggregateId: id}) => {
        await store.delete(tableName, {id});
    }
};
