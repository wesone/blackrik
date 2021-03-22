const {EVENT_LIMIT_REPLAY} = require('./Constants');
const Event = require('./Event');

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
        return Event.from({
            ...event,
            position: await this.blackrik._eventStore.save(event)
        });
    }

    async sendEvent(event)
    {
        return await this.eventBus.publish(event) && event;
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

    async replayEvents(types)
    {
        let next = null;
        do
        {
            const {events, cursor} = await this.blackrik._eventStore.load({
                types,
                limit: EVENT_LIMIT_REPLAY,
                cursor: next
            });

            if(events.length)
                await Promise.all(events.map(event => this.sendEvent({...event, isReplay: true})));
            next = cursor;
        } while(next);
    }
}

module.exports = EventHandler;
