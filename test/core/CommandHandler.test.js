const CommandHandler = require('../../src/core/CommandHandler');
const BlackrikMock = require('../mock/Blackrik');

const aggregateName = 'testAggregate';
const aggregateId = '42';
const type = 'command';
const typeWithEvent = 'commandWithEvent';

const exampleEvent = {test: 42};

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
    blackrik = new BlackrikMock(exampleEvent);
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

describe('CommandHandler processes HTTP requests', () => {
    test('/commands', async () => {
        const event = await commandHandler.handle({
            blackrik: {},
            body: {aggregateName, aggregateId, type: typeWithEvent}
        });

        expect(event).toStrictEqual(exampleEvent);
        expect(blackrik._eventHandler.publish).toHaveBeenCalledTimes(1);
    });
    test('/command/:aggregateName/:type', async () => {
        const event = await commandHandler.handle({
            blackrik: {},
            params: {aggregateName, type: typeWithEvent},
            body: {aggregateId}
        });

        expect(event).toStrictEqual(exampleEvent);
        expect(blackrik._eventHandler.publish).toHaveBeenCalledTimes(1);
    });
});

test('CommandHandler handles overlapping events', () => {
    blackrik.eventShouldOverlap = true;
    expect(commandHandler.process({aggregateName, aggregateId, type: typeWithEvent})).rejects.toThrow();
});
