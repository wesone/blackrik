
const tableName = 'users';

module.exports = {
    get: async (store, args) => {
        return await store.findOne(tableName, {id: args.id}, args.position);
    },
    list: async (store, args) => {
        return await store.find(tableName, {
            
        },args.position);
    }
};
