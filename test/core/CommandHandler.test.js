const CommandHandler = require('../../src/core/CommandHandler');

const aggregateName = 'test';
const aggregateId = '42';
const type = 'noeventcommand';
const typeWithEvent = 'eventcommand';

const exampleEvent = {test: 42};

class BlackrikMock
{
    eventShouldOverlap = false;
    isFirstAggregateEvent = false;

    _aggregates = {
        [aggregateName]: {
            commands: {
                [type]: (/* command, state, context */) => {},
                [typeWithEvent]: (/* command, state, context */) => ({})
            },
            load: (/* eventStore, aggregateId */) => ({
                state: {},
                latestEvent: this.isFirstAggregateEvent
                    ? null
                    : {aggregateVersion: 1}
            })
        }
    };
    _eventHandler = {
        publish: jest.fn((aggregateName, {causationId}) => 
            this.eventShouldOverlap
                ? false
                : causationId
                    ? {...exampleEvent, causationId}
                    : exampleEvent
        )
    };
    _eventStore = {};
}

describe('CommandHandler detects', () => {
    const blackrik = new BlackrikMock();
    const commandHandler = new CommandHandler(blackrik);

    test('invalid aggregateNames', () => {
        expect(commandHandler.process({aggregateId, type})).rejects.toThrow();
        expect(commandHandler.process({aggregateName: 'invalid', aggregateId, type})).rejects.toThrow();
    });

    test('invalid aggregateIds', () => {
        expect(commandHandler.process({aggregateName, type})).rejects.toThrow();
    });

    test('invalid types', () => {
        expect(commandHandler.process({aggregateName, aggregateId})).rejects.toThrow();
        expect(commandHandler.process({aggregateName, aggregateId, type: 'invalid'})).rejects.toThrow();
    });

    test('valid commands', () => {
        expect(commandHandler.process({aggregateName, aggregateId, type})).resolves.not.toThrow();
        expect(blackrik._eventHandler.publish).toHaveBeenCalledTimes(0);
    });
});

let blackrik;
let commandHandler;
beforeEach(() => {
    blackrik = new BlackrikMock();
    commandHandler = new CommandHandler(blackrik);
});

test('CommandHandler processes events', async () => {
    let event = await commandHandler.process({aggregateName, aggregateId, type: typeWithEvent});

    expect(event).toStrictEqual(exampleEvent);
    expect(blackrik._eventHandler.publish).toHaveBeenCalledTimes(1);

    blackrik.isFirstAggregateEvent = true;
    event = await commandHandler.process({aggregateName, aggregateId, type: typeWithEvent});

    expect(event).toStrictEqual(exampleEvent);
    expect(blackrik._eventHandler.publish).toHaveBeenCalledTimes(2);
});

test('CommandHandler processes causation events', async () => {
    const causationEvent = {
        correlationId: '21',
        id: '42'
    };
    const event = await commandHandler.process({aggregateName, aggregateId, type: typeWithEvent}, {causationEvent});

    expect(event).toStrictEqual({...exampleEvent, causationId: causationEvent.id});
    expect(blackrik._eventHandler.publish).toHaveBeenCalledTimes(1);
});

test('CommandHandler processes HTTP requests', async () => {
    const event = await commandHandler.handle({
        blackrik: {},
        body: {aggregateName, aggregateId, type: typeWithEvent}
    });

    expect(event).toStrictEqual(exampleEvent);
    expect(blackrik._eventHandler.publish).toHaveBeenCalledTimes(1);
});

test('CommandHandler handles overlapping events', () => {
    blackrik.eventShouldOverlap = true;
    expect(commandHandler.process({aggregateName, aggregateId, type: typeWithEvent})).rejects.toThrow();
});
