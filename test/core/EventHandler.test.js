const EventHandler = require('../../src/core/EventHandler');
const {EVENT_LIMIT_REPLAY} = require('../../src/core/Constants');
const {TOMBSTONE_EVENT_TYPE} = require('../../src/core/Constants');

class EventStoreMock
{
    constructor(throwOnSave = false, overlapOnSave = false)
    {
        this.events = [];

        this.save = jest.fn(this._save);
        this.load = jest.fn(this._load);
        this.delete = jest.fn(this._delete);

        this.throwOnSave = throwOnSave;
        this.overlapOnSave = overlapOnSave;
    }

    async _save(event)
    {
        if(this.throwOnSave)
            throw Error('Something went wrong');
        if(this.overlapOnSave)
            return false;

        const position = this.events.length + 1;
        this.events.push({
            ...event,
            position 
        });
        return position;
    }

    async _load(filter)
    {
        const copyEvents = events => events.map(event => ({...event}));

        if(!filter.limit || filter.limit > this.events.length)
            return {
                events: copyEvents(this.events),
                cursor: null
            };

        const currentCursor = filter.cursor || 0;
        const cursor = currentCursor + filter.limit;
        return {
            events: copyEvents(this.events.slice(currentCursor, cursor)),
            cursor: cursor > this.events.length
                ? null
                : cursor
        };
    }

    async _delete(aggregateId)
    {
        const eventCount = this.events.reduce((acc, event) => event.aggregateId === aggregateId ? acc + 1 : acc, 0);
        this.events = this.events.filter(event => event.aggregateId !== aggregateId);
        return eventCount;
    }
}

class EventBusMock
{
    constructor()
    {
        this.started = false;
        this.subscribers = {};

        this.stop = jest.fn(this._stop);
    }

    async start()
    {
        this.started = true;
    }

    async _stop()
    {
        this.started = false;
    }

    async publish(name, event)
    {
        if(this.subscribers[name] && this.subscribers[name][event.type])
            return this.subscribers[name][event.type].map(callback => callback(event));
        return [];
    }

    async subscribe(name, type, callback)
    {
        if(this.started)
            throw Error('EventBus already started.');
            
        if(!this.subscribers[name])
            this.subscribers[name] = {};
        if(!this.subscribers[name][type])
            this.subscribers[name][type] = [];
        this.subscribers[name][type].push(callback);
    }
}

beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
    console.error.mockRestore();
});
afterEach(() => {
    console.error.mockClear();
});

let eventStore;
let eventBus;
let eventHandler;
const aggregateName = 'testAggregate';
const createEvent = () => ({
    aggregateId: '0648b417-80c7-42ca-a027-9efe08bc00c4',
    type: 'EXAMPLE_EVENT',
    payload: {
        field: 'value'
    }
});

beforeEach(async () => {
    eventStore = new EventStoreMock();
    eventBus = new EventBusMock();
    eventHandler = new EventHandler(eventStore, eventBus, {});
    await eventHandler.init();
});

describe('EventHandler', () => {
    test('takes callbacks and executes them', async () => {
        const callback = jest.fn(() => {});
        const callback2 = jest.fn(() => {});

        const event = createEvent();

        await eventHandler.subscribe(aggregateName, event.type, callback);
        await eventHandler.subscribe(aggregateName, event.type, callback2);
        await eventHandler.start();
        const filledEvent = await eventHandler.publish(aggregateName, event);

        expect(filledEvent).toBeInstanceOf(Object);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenNthCalledWith(1, filledEvent);
        expect(callback2).toHaveBeenCalledTimes(1);
        expect(callback2).toHaveBeenNthCalledWith(1, filledEvent);
    });

    test('persists events', async () => {    
        const events = [
            createEvent(),
            createEvent()
        ];

        await eventHandler.start();
        const filledEvents = await Promise.all(events.map(event => eventHandler.publish(aggregateName, event)));

        expect(eventStore.save).toHaveBeenCalledTimes(events.length);
        filledEvents.forEach((event, i) => {
            if(i > 0)
                expect(event.position).toBeGreaterThan(filledEvents[i-1].position);
        });
    });

    test('handles errors on publishing', async () => { 
        eventStore = new EventStoreMock(true);
        eventHandler = new EventHandler(eventStore, eventBus, {});
        await eventHandler.init();
        await eventHandler.start();

        await expect(eventHandler.publish(aggregateName, createEvent())).rejects.toThrow();
    });

    test('handles rejected events', async () => { 
        eventStore = new EventStoreMock(false, true);
        eventHandler = new EventHandler(eventStore, eventBus, {});
        await eventHandler.init();
        await eventHandler.start();

        await expect(eventHandler.publish(aggregateName, createEvent())).rejects.toThrow();
    });

    test(`publish executes a deletion if event type is ${TOMBSTONE_EVENT_TYPE}`, async () => {
        const event = createEvent();

        await expect(eventHandler.publish(aggregateName, event)).resolves.not.toThrow();
        expect(eventStore.delete).toHaveBeenCalledTimes(0);

        event.type = TOMBSTONE_EVENT_TYPE;

        await expect(eventHandler.publish(aggregateName, event)).resolves.not.toThrow();
        expect(eventStore.delete).toHaveBeenCalled();
    });
});

describe('EventHandler handles replays', () => {
    test('with events', async () => { 
        const callback = jest.fn(() => {});

        const eventTestCount = EVENT_LIMIT_REPLAY * 2 - 1;
        const events = [];
        for(let i = 0; i < eventTestCount; i++)
            events.push(createEvent());
        const eventType = events[0].type;

        await eventHandler.subscribe(aggregateName, eventType, callback);
        await eventHandler.start();
        const filledEvents = await Promise.all(events.map(event => eventHandler.publish(aggregateName, event)));
        eventStore.events = filledEvents; // otherwise the EventStoreMock would have incomplete events

        await eventHandler.replayEvents([
            [aggregateName, [eventType]]
        ]);

        // due to async execution, we need to wait for the next tick 
        await new Promise(r => setTimeout(r, 1));

        expect(callback).toHaveBeenCalledTimes(eventTestCount * 2);
        for(let i = 0; i < eventTestCount; i++)
            expect(callback).toHaveBeenNthCalledWith(i+1, filledEvents[i]);
        for(let i = 0; i < eventTestCount; i++)
            expect(callback).toHaveBeenNthCalledWith(eventTestCount+i+1, {...filledEvents[i], isReplay: true});
    });

    test('without events', async () => {
        const callback = jest.fn(() => {});
        const eventType = createEvent().type;

        await eventHandler.subscribe(aggregateName, eventType, callback);
        await eventHandler.start();

        await eventHandler.replayEvents([
            [aggregateName, [eventType]]
        ]);

        expect(callback).toHaveBeenCalledTimes(0);
    });
});

test('EventHandler closes the EventBus', async () => {
    await eventHandler.start();
    await eventHandler.stop();

    expect(eventBus.stop).toHaveBeenCalledTimes(1);
});
