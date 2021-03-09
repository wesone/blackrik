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

    async sendEvent()
    {
        await this.bus.publish(event);
    }

    async subscribe(type, callback)
    {
        await this.bus.subscribe(type, callback);
    }

    async publish(event)
    {
        console.log('PUBLISH', event);
        return this.persistEvent(event)
            .then(this.sendEvent.bind(this));
    }
}

module.exports = EventBus;
