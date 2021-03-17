const {v4: uuid} = require('uuid');

class Event
{
    #data;

    static from(data)
    {
        const event = new this(data);
        if(data.id && data.id.length)
            event.#data.id = data.id;
        if(!isNaN(data.timestamp) && data.timestamp > 0)
            event.#data.timestamp = data.timestamp;
        return event;
    }

    constructor(data)
    {
        const {
            aggregateId,
            type,
            correlationId = null,
            causationId = null,
            payload = null
        } = data; 

        const id = uuid();
        this.#data = {
            id,
            aggregateId,
            type,
            timestamp: Date.now(),
            correlationId: correlationId || id,
            causationId,
            payload
        };

        Object.keys(this.#data).forEach(key => Object.defineProperty(this, key, {
            get: () => this.#data[key]
        }));
    }

    toJSON()
    {
        return this.#data;
    }
}

module.exports = Event;
