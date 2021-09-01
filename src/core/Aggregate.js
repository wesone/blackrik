const {EVENT_LIMIT_AGGREGATE} = require('./Constants');

class Aggregate
{
    static isValid({name/* , commands, projection */})
    {
        if(!name || !name.length)
            throw Error('Missing property \'name\' inside aggregate.');
    }

    static fromArray(aggregates)
    {
        const transformed = {};
        aggregates.forEach(aggregate => {
            const {name} = aggregate;
            if(transformed[name])
                throw Error(`Duplicate aggregate name '${name}'.`);
            transformed[name] = new this(aggregate);
        });
        return transformed;
    }

    constructor({name, commands, projection})
    {
        this.name = name;
        this.commands = commands;
        this.projection = projection;
        this.constructor.isValid(this);
    }

    hasProjection(eventType)
    {
        return Object.prototype.hasOwnProperty.call(this.projection, eventType);
    }

    async _reduceEvents(events, state = {})
    {
        for(const event of events)
        {
            const {type} = event;
            if(this.hasProjection(type))
                state = await this.projection[type](state, event);      
        }
        return state;
    }

    async load(eventStore, aggregateId)
    {
        const filter = {
            aggregateIds: [aggregateId],
            // types: Object.keys(this.projection).filter(type => type !== 'init'), //TODO needs more performance tests... if used, latestEvent must be fetched with another call to eventStore.load
            limit: EVENT_LIMIT_AGGREGATE
        };
        let state = (typeof this.projection.init === 'function' 
            ? await this.projection.init()
            : {});
        let next = null;
        let latestEvent = null;
        do
        {
            filter.cursor = next;
            const {events, cursor} = await eventStore.load(filter);
            if(events.length)
            {
                state = await this._reduceEvents(events, state);
                latestEvent = events.pop();
            }
            next = cursor;
        } while(next);
        return {state, latestEvent};
    }
}

module.exports = Aggregate;
