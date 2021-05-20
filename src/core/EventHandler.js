const {
    // EVENT_HANDLER_TABLE_NAME: TABLE_NAME,
    EVENT_LIMIT_REPLAY
} = require('./Constants');
const Event = require('./Event');
const ListenerMap = require('../utils/ListenerMap');
const Q = require('../utils/Q');
const {ConflictError} = require('./Errors');

class EventHandler
{
    constructor(eventStore, eventBus, store)
    {
        this.eventStore = eventStore;
        this.eventBus = eventBus;
        this.store = store;

        this.listeners = {};
        this.queues = {};
    }

    addListener(name, type, callback)
    {
        if(!this.listeners[name])
            this.listeners[name] = new ListenerMap();
        return this.listeners[name].add(type, callback);
    }

    addQueue(name)
    {
        if(this.queues[name])
            return;
        this.queues[name] = new Q();
    }

    async init()
    {

    }

    async start()
    {
        return await this.eventBus.start();
    }

    async stop()
    {
        return await this.eventBus.stop();
    }

    async onEvent(name, event)
    {
        this.queues[name].add(event);
        if(this.queues[name].length > 1)
            await this.queues[name].waitFor(event);

        // parallel
        // await Promise.all(
        //     this.listeners[name]
        //         .execute(event.type, event)
        // );

        // consecutively
        await this.listeners[name].iterate(event.type, event);

        this.queues[name].next();
    }

    async persistEvent(event)
    {
        //TODO create snapshot if too many events are stored
        try
        {
            const position = await this.eventStore.save(event);
            if(position === false)
                throw new ConflictError('Events overlapped');
            return Event.from({...event, position});
        }
        catch(e)
        {
            if(!(e instanceof ConflictError))
                console.error(e);
            throw e;
        }
    }

    async sendEvent(name, event)
    {
        return await this.eventBus.publish(name, event) && event;
    }

    async subscribe(name, type, callback)
    {
        this.addQueue(name);
        if(this.addListener(name, type, callback))
            await this.eventBus.subscribe(name, type, async event => {
                await this.onEvent(name, event);
            });
    }

    async publish(name, event)
    {
        return this.persistEvent(event)
            .then(event => this.sendEvent(name, event));
    }

    async replayEvents(jobs)
    {
        // await this.store.update(TABLE_NAME, null, {position: -1});

        for(let i = 0; i < jobs.length; i++)
        {
            const [name, types] = jobs[i];

            let next = null;
            do
            {
                const {events, cursor} = await this.eventStore.load({
                    types,
                    limit: EVENT_LIMIT_REPLAY,
                    cursor: next
                });

                if(events.length)
                    // await Promise.all(events.map(event => this.sendEvent(name, {...event, isReplay: true}))); //TODO make sure events are send in the right order
                    for(const event of events)
                        await this.sendEvent(name, {...event, isReplay: true});
                next = cursor;
            } while(next); 
        }
    }
}

module.exports = EventHandler;
