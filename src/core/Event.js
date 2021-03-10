class Event
{
    constructor({type, correlationId, causationId, payload})
    {
        return {
            type,
            timestamp: Date.now(),
            correlationId,
            causationId,
            payload
        };
    }
}

module.exports = Event;
