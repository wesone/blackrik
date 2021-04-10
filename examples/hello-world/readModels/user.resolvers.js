const tableName = 'Users';

module.exports = {
    get: async (store, {id, position}) => {
        if(!id)
            return null;
        return await store.findOne(tableName, {id}, {position});
    }
};
