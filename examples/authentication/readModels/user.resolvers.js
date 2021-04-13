const tableName = 'Users';

module.exports = {
    get: async (store, args, context) => {
        if(context.user !== 'system') // users can only query their own entry
            args.id = context.user.id;
        return await store.findOne(tableName, args);
    }
};
