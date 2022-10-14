const CommandHandler = require('../../src/core/CommandHandler');
const BlackrikMock = require('../_mock/Blackrik');
const {TOMBSTONE_EVENT_TYPE} = require('../../src/core/Constants');

const aggregateName = 'testAggregate';
const aggregateId = '42';
const type = 'command';
const typeWithEvent = 'commandWithEvent';

const exampleEvent = {type: 'test'};

describe('CommandHandler detects', () => {
    const blackrik = new BlackrikMock();
    const commandHandler = new CommandHandler(blackrik);

    test('invalid aggregateNames', async () => {
        await expect(commandHandler.process({aggregateId, type})).rejects.toThrow();
        await expect(commandHandler.process({aggregateName: 'invalid', aggregateId, type})).rejects.toThrow();
    });

    test('invalid aggregateIds', async () => {
        await expect(commandHandler.process({aggregateName, type})).rejects.toThrow();
    });

    test('invalid types', async () => {
        await expect(commandHandler.process({aggregateName, aggregateId})).rejects.toThrow();
        await expect(commandHandler.process({aggregateName, aggregateId, type: 'invalid'})).rejects.toThrow();
    });

    test('valid commands', async () => {
        await expect(commandHandler.process({aggregateName, aggregateId, type})).resolves.not.toThrow();
        expect(blackrik._eventHandler.publish).toHaveBeenCalledTimes(0);
    });
});

describe('CommandHandler', () => {
    let blackrik;
    let commandHandler;
    beforeEach(() => {
        blackrik = new BlackrikMock(exampleEvent);
        commandHandler = new CommandHandler(blackrik);
    });

    test('processes events', async () => {
        let event = await commandHandler.process({aggregateName, aggregateId, type: typeWithEvent});

        expect(event).toStrictEqual(exampleEvent);
        expect(blackrik._eventHandler.publish).toHaveBeenCalledTimes(1);

        blackrik._aggregates[aggregateName].load.mockReturnValue({
            state: {},
            latestEvent: null
        });
        event = await commandHandler.process({aggregateName, aggregateId, type: typeWithEvent});

        expect(event).toStrictEqual(exampleEvent);
        expect(blackrik._eventHandler.publish).toHaveBeenCalledTimes(2);
    });

    test('detects invalid events (returned by the handler)', async () => {
        const invalidEvent = {test: 42};
        blackrik = new BlackrikMock(invalidEvent);
        commandHandler = new CommandHandler(blackrik);
        const event = await commandHandler.process({aggregateName, aggregateId, type: typeWithEvent});

        expect(event).toBe(null);
        expect(blackrik._eventHandler.publish).toHaveBeenCalledTimes(0);
    });

    test('processes causation events', async () => {
        const causationEvent = {
            correlationId: '21',
            id: '42'
        };
        const event = await commandHandler.process({aggregateName, aggregateId, type: typeWithEvent}, {causationEvent});

        expect(event).toStrictEqual({...exampleEvent, causationId: causationEvent.id});
        expect(blackrik._eventHandler.publish).toHaveBeenCalledTimes(1);
    });

    describe('processes HTTP requests', () => {
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

    test('handles overlapping events', async () => {
        blackrik.eventShouldOverlap = true;
        await expect(commandHandler.process({aggregateName, aggregateId, type: typeWithEvent})).rejects.toThrow();
    });

    describe('deleteAggregate', () => {
        test('throws for invalid aggregate names', async () => {
            await expect(commandHandler.deleteAggregate('invalid', aggregateId)).rejects.toThrow();
        });
        test('returns false for unknown aggregate ids', async () => {
            blackrik._aggregates[aggregateName].loadLatestEvent.mockReturnValue(null);
            await expect(commandHandler.deleteAggregate(aggregateName, aggregateId)).resolves.toBe(false);
        });
        test(`emits event with type ${TOMBSTONE_EVENT_TYPE}`, async () => {
            await expect(commandHandler.deleteAggregate(aggregateName, aggregateId)).resolves.toBe(true);
            expect(blackrik._eventHandler.publish).toHaveBeenCalledWith(
                aggregateName, 
                expect.objectContaining({
                    aggregateId,
                    type: TOMBSTONE_EVENT_TYPE
                })
            );
        });
    });
});
