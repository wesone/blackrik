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

    _reduceEvents(events, state = null)
    {
        state = state || (typeof this.projection.init === 'function' 
            ? this.projection.init()
            : {});
        events.forEach(event => {
            const {type} = event;
            if(this.hasProjection(type))
                state = this.projection[type](state, event);
        });
        return state;
    }

    async load(eventStore, aggregateId)
    {
        const aggregateIds = [aggregateId];
        let state = null;
        let next = null;
        do
        {
            // {
            //     aggregateIds: Array,
            //     types: Array,
            //     since: Number,
            //     until: Number,
            //     limit: Number
            // }
            const {events, cursor} = await eventStore.load({
                aggregateIds,
                limit: 100000, //TODO outsource
                next
            });
            state = this._reduceEvents(events, state);
            next = cursor;
        } while(next);
        return state;
    }
}

module.exports = Aggregate;
