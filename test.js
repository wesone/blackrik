const config = { host: 'localhost', port: 3306, user: 'root', password: '1234', database: 'eventStore' };
const eventStoreAdapter = require('./src/adapters/eventstore-mysql');
const Event = require('./src/core/Event');

(async () => {
    const eventStore = eventStoreAdapter(config);
    await eventStore.init();

    // const event = new Event({
    //     aggregateId: 'testAggregateId',
    //     aggregateVersion: 0,
    //     type: 'testType',
    //     timestamp: Date.now(),
    //     correlationId: 'testCorrelationId',
    //     causationId: 'testCausationId',
    //     payload: 'testPayload'
    // });
    // await eventStore.save(event.toJSON());

    await eventStore.load({
        aggregateIds: [
            'testAggregateId',
            'id2',
            'id3',
            'id4',
            'id5'
        ],
        types: [
            'testType',
            'type2',
            'type3'
        ],
        since: 1615878000000,
        until: Date.now(),
        limit: 2
    });
})();
