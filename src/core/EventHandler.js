const {EVENT_HANDLER_TABLE_NAME: TABLE_NAME, EVENT_LIMIT_REPLAY} = require('./Constants');
const Event = require('./Event');
const ListenerMap = require('../utils/ListenerMap');

class EventHandler
{
    constructor(blackrik, eventBus, store)
    {
        this.blackrik = blackrik;
        this.eventBus = eventBus;
        this.store = store;

        this.listeners = {};
    }

    addListener(name, type, callback)
    {
        if(!this.listeners[name])
            this.listeners[name] = new ListenerMap();
        return this.listeners[name].add(type, callback);
    }

    async init()
    {
        if(await this.store.defineTable(TABLE_NAME, {
            position: 'Number'
        }))
            await this.store.insert(TABLE_NAME, {position: -1});
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
        if(this.addListener(name, type, callback))
            await this.eventBus.subscribe(name, type, async event => {
                const {position} = event;
                if(await this.store.update(TABLE_NAME, {position: {$lt: position}}, {position}))
                    await Promise.all(
                        this.listeners[name]
                            .execute(event.type, event)
                            .map(cb => cb.catch(error => console.error(error)))
                    );
            });
    }

    async publish(name, event)
    {
        return this.persistEvent(event)
            .then(event => this.sendEvent(name, event))
            .catch(() => false);
    }

    async replayEvents(jobs)
    {
        await this.store.update(TABLE_NAME, null, {position: -1});

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
                    // await Promise.all(events.map(event => this.sendEvent(name, {...event, isReplay: true}))); //TODO make sure events are send in the right order
                    for(let i = 0; i < events.length; i++)
                        await this.sendEvent(name, {...events[i], isReplay: true});
                next = cursor;
            } while(next); 
        }
    }
}

module.exports = EventHandler;
