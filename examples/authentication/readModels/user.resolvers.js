const tableName = 'Users';

module.exports = {
    get: async (store, args) => {
        return await store.findOne(tableName, args);
    }
};
