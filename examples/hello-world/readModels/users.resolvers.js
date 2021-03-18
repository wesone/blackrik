
const tableName = 'users';

module.exports = {
    get: async (store, args) => {
        return await store.findOne(tableName, {
            conditions:{id: args.id}
        });
    },
    list: async (store, args) => {
        console.log(args);
        return await store.find(tableName, {
            
        });
    }
};
