const tableName = 'Users';

module.exports = {
    get: async (store, {id, position}/* , context */) => {
        if(!id)
            return null;
        return await store.findOne(tableName, {id}, {position});
    }
};
