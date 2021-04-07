
const tableName = 'users';

module.exports = {
    get: async (store, args) => {
        if(!args.id)
            return null;
        return await store.findOne(tableName, {id: args.id}, {position: args.position});
    },
    list: async (store, args) => {
        return await store.find(tableName, {
            
        }, {position: args.position});
    }
};
