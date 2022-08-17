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

    async loadLatestEvent(eventStore, aggregateId)
    {
        const {events} = await eventStore.load({
            aggregateIds: [aggregateId],
            reverse: true,
            limit: 1
        });

        if(events.length)
            return events.pop();
        return null;
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
        
        return {
            state, 
            latestEvent
        };
    }
}

module.exports = Aggregate;



//TODO
// Blackrik:
// 	- Funktion zum Löschen von Aggregaten (name, aggregateId, payload = null)
// 		- Entfernt Events aus dem Store
// 		- Sendet TOMBSTONE-Event (optionale Payload)
// 	- CommandHandler -> Senden des TOMBSTONE-Events
// 		- Entfernt alle Events des Aggregats aus dem Store
	
// 	- CHANGELOG (minor change)
// 	- Docs anpassen


// Sensitive data (and handling General Data Protection Regulation (GDPR))
// 	Individual events are generally considered immutable. 
// 	the event store after all is an append-only database. 

// 	to remove on request there would be a few options
// 	- Referencing
// 		- you would just store a reference to the sensitive data inside the eventstore 
// 			and if a deletion is desired you would only delete the data in the other system
// 			the reference will now point to "nothing" and the eventstore would'nt change at all
// 	- Crypto-shredding
// 	- Deleting
// 		- You shouldn't delete the events from your event store. an event is something that happened and the past cannot be changed.
// 		- but what if you delete all events that belong to a specific aggregate id?
// 			as an aggregate is an encapsuled unit, deleting that unit would not affect any other aggregate