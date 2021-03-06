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

    _loadEvents(id)
    {
        //TODO load all events from eventstore that belong to aggregateId
        return [
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
    }

    _reduceEvents(events)
    {
        let state = typeof this.projection.init === 'function' 
            ? this.projection.init()
            : {};
        events.forEach(event => {
            const {type: eventType} = event;
            if(Object.prototype.hasOwnProperty.call(this.projection, eventType))
                state = this.projection[eventType](state, event);
        });
        return state;
    }

    load(aggregateId)
    {
        return this._reduceEvents(this._loadEvents(aggregateId));
    }
}

module.exports = Aggregate;
