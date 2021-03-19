
const tableName = 'users';

async function getLastPosition(store)
{
    return (await store.findOne(tableName,{
        fields: ['lastPosition'],
        sort: {lastPosition: -1}
    }))?.lastPosition ?? -1;
}

async function checkPosition(store, args)
{
    if(args?.position)
    {
        const lastPosition = await getLastPosition(store);
        if(args.position > lastPosition)
        {
            const error =  new Error('Data not yet availible');
            error.status = 409;
            throw error;
        }
    }
}

module.exports = {
    get: async (store, args) => {
        await checkPosition(store, args);
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
