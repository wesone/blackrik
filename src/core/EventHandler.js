class EventHandler
{
    constructor(blackrik, bus)
    {
        this.blackrik = blackrik;
        this.bus = bus;
    }

    async start()
    {
        await this.bus.start();
    }

    async persistEvent(event)
    {
        await this.blackrik._eventStore.save(event);
        return event;
    }

    async sendEvent(event)
    {
        await this.bus.publish(event);
    }

    async subscribe(type, callback)
    {
        await this.bus.subscribe(type, callback);
    }

    async publish(event)
    {
        //TODO implement optimistic concurrency control
        return this.persistEvent(event)
            .then(this.sendEvent.bind(this));
    }
}

module.exports = EventHandler;
