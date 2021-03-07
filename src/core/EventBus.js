class EventBus
{
    constructor(blackrik, bus)
    {
        this.blackrik = blackrik;
        this.bus = bus;
    }

    subscribe(type, callback)
    {
        //TODO this.bus.subscribe(type, callback);
    }

    publish(event)
    {
        //TODO this.blackrik._eventStore.save(event);
        //TODO this.bus.publish(event);
        console.log('PUBLISH', event);
    }
}

module.exports = EventBus;
