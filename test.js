const config = { host: 'localhost', port: 3306, user: 'root', password: '1234', database: 'eventStore' };
const eventStoreAdapter = require('./src/adapters/eventstore-mysql');

(async () => {
    const eventStore = eventStoreAdapter(config);
    await eventStore.init();
})();
