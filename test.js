const config = { host: 'localhost', port: 3306, user: 'root', password: '1234', database: 'eventStore' };
const eventStoreAdapter = require('./src/adapters/eventstore-mysql');

test('testfile needs a test', () => {
    expect(1 + 1).toBe(2);
});

(async () => {
    const eventStore = eventStoreAdapter(config);
    await eventStore.init();
    // const Event = require('./src/core/Event');
    // for(let i = 0; i < 5; i++)
    // {
    //     const event = new Event({
    //         aggregateId: 'testAggregateId',
    //         aggregateVersion: i,
    //         type: 'testType',
    //         timestamp: Date.now(),
    //         correlationId: 'testCorrelationId',
    //         causationId: 'testCausationId',
    //         payload: JSON.stringify({ test: 'testPayload'})
    //     });
    //     const test = await eventStore.save(event.toJSON());
    //     console.log(test);
    // }

    // const result = await eventStore.load({
    //     aggregateIds: [
    //         'testAggregateId'
    //     ],
    //     types: [
    //         'testType'
    //     ],
    //     since: 1615878000000,
    //     until: Date.now(),
    //     limit: 5,
    //     cursor: null
    // });
    // console.log(result);

    await eventStore.close();
})();
