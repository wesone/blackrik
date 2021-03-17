const {USER_CREATED} = require('../events/users');

const tableName = 'users';

module.exports = {
    init: async store => {
        await store.createTable(tableName, {
            id: {
                type: 'uuid',
                primaryKey: true,
            },
            name: {
                type: 'String'
            },
            lastEvent: {
                type: 'uuid',
            }
        });
    },
    [USER_CREATED]: async (store, event) => {
        console.log('ReadModel projection executed', event);
        await store.insert(tableName, {id: event.aggregateId ,name: event.payload.name, lastEvent: event.id});
    }
};
