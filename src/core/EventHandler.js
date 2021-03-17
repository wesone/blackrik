class EventHandler
{
    constructor(blackrik, eventBus)
    {
        this.blackrik = blackrik;
        this.eventBus = eventBus;
    }

    async start()
    {
        return await this.eventBus.start();
    }

    async persistEvent(event)
    {
        //TODO create snapshot if too many events are stored
        await this.blackrik._eventStore.save(event);
        return event;
    }

    async sendEvent(event)
    {
        return await this.eventBus.publish(event);
    }

    async subscribe(type, callback)
    {
        return await this.eventBus.subscribe(type, callback);
    }

    async publish(event)
    {
        return this.persistEvent(event)
            .then(this.sendEvent.bind(this))
            .catch(() => false);
    }
}

module.exports = EventHandler;
