class Event
{
    constructor({aggregateId, type, correlationId, causationId, payload})
    {
        return {
            aggregateId,
            type,
            timestamp: Date.now(),
            correlationId,
            causationId,
            payload
        };
    }
}

module.exports = Event;
