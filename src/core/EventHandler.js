class EventHandler
{
    constructor(blackrik, eventBus)
    {
        this.blackrik = blackrik;
        this.eventBus = eventBus;
    }

    async start()
    {
        await this.eventBus.start();
    }

    async persistEvent(event)
    {
        await this.blackrik._eventStore.save(event);
        return event;
    }

    async sendEvent(event)
    {
        await this.eventBus.publish(event);
    }

    async subscribe(type, callback)
    {
        await this.eventBus.subscribe(type, callback);
    }

    async publish(event)
    {
        return this.persistEvent(event)
            .then(this.sendEvent.bind(this))
            .catch(() => false);
    }
}

module.exports = EventHandler;
