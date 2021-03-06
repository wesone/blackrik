class Aggregate
{
    static fromArray(aggregates)
    {
        const transformed = {};
        aggregates.forEach(aggregate => {
            const {name} = aggregate;
            if(!name || !name.length)
                throw Error('Missing property \'name\' inside aggregate.');
            if(transformed[name])
                throw Error('Duplicate aggregate name.');
            //TODO validate commands
            transformed[name] = new this(aggregate);
        });
        return transformed;
    }

    constructor({name, commands, projection})
    {
        this.name = name;
        this.commands = commands;
        this.projection = projection;
    }

    load(aggregateId)
    {
        //TODO load all events from eventstore that belong to aggreagteId
        const events = [
            {
                type: 'USER_UPDATED',
                payload: {
                    name: '1'
                }
            },
            {
                type: 'USER_UPDATED',
                payload: {
                    name: '2'
                }
            },
            {
                type: 'USER_UPDATED',
                payload: {
                    name: '3'
                }
            },
            {
                type: 'USER_UPDATED',
                payload: {
                    name: '4'
                }
            }
        ];

        const projection = this.projection;
        let store = projection.init();
        events.forEach(event => {
            const {type: eventType} = event;
            if(Object.prototype.hasOwnProperty.call(projection, eventType))
                store = projection[eventType](store, event);
        });
        return store;
    }
}

module.exports = Aggregate;
