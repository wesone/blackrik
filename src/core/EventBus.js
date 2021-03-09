class EventBus
{
    constructor(blackrik, bus)
    {
        this.blackrik = blackrik;
        this.bus = bus;
    }

    async persistEvent(event)
    {
        //TODO this.blackrik._eventStore.save(event);
        return event;
    }

    sendEvent()
    {
        //TODO this.bus.publish(event);
    }

    subscribe(type, callback)
    {
        //TODO this.bus.subscribe(type, callback);
    }

    async publish(event)
    {
        console.log('PUBLISH', event);
        return this.persistEvent(event)
            .then(this.sendEvent.bind(this));
    }
}

module.exports = EventBus;
