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

    async sendEvent(name, event)
    {
        return await this.eventBus.publish(name, event) && event;
    }

    async subscribe(name, type, callback)
    {
        return await this.eventBus.subscribe(name, type, callback);
    }

    async publish(name, event)
    {
        return this.persistEvent(event)
            .then(event => this.sendEvent(name, event))
            .catch(() => false);
    }

    async replayEvents(jobs)
    {
        for(let i = 0; i < jobs.length; i++)
        {
            const [name, types] = jobs[i];

            let next = null;
            do
            {
                const {events, cursor} = await this.blackrik._eventStore.load({
                    types,
                    limit: EVENT_LIMIT_REPLAY,
                    cursor: next
                });

                if(events.length)
                    await this.sendEvent(name, events.map(event => ({...event, isReplay: true})) );
                next = cursor;
            } while(next); 
        }
    }
}

module.exports = EventHandler;
