module.exports = {
    EVENTBUS: {
        Kafka: __dirname + '/eventbus-kafka'
    },
    EVENTSTORE: {
        MySQL: __dirname + '/eventstore-mysql'
    },
    READMODELSTORE: {
        MySQL: __dirname + '/readmodelstore-mysql'
    }
};
