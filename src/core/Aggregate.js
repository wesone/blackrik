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

    async _loadEvents(eventStore, aggregateId)
    {
        return eventStore.load(aggregateId);
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

    async load(eventStore, aggregateId)
    {
        return this._reduceEvents(await this._loadEvents(eventStore, aggregateId));
    }
}

module.exports = Aggregate;
