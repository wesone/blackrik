class Aggregates
{
    static transform(aggregates)
    {
        const transformed = {};
        aggregates.forEach(({name, commands, projection}) => {
            if(!name || !name.length)
                throw Error('Missing property \'name\' inside aggregate.');
            if(aggregates[name])
                throw Error('Duplicate aggregate name.');
            //TODO validate commands
            transformed[name] = {
                commands,
                projection
            };
        });
        return transformed;
    }

    static load(aggregateId)
    {
        //TODO load aggregate state
        return {};
    }
}

module.exports = Aggregates;
