
const tableName = 'users';

async function getLastPosition(store)
{
    return (await store.findOne(tableName,{
        fields: ['lastPosition'],
        order: {lastPosition: 1}
    }))?.lastPosition ?? -1;
}

module.exports = {
    get: async (store, args) => {
        if(args?.position)
        {
            const lastPosition = await getLastPosition(store);
            if(args.position > lastPosition)
            {
                throw new Error('Data not yet availible');
            }
        }
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
