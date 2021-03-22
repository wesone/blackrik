module.exports = {
    EVENTBUS: {
        Kafka: __dirname + '/eventbus-kafka',
        Local: __dirname + '/eventbus-local'
    },
    EVENTSTORE: {
        MySQL: __dirname + '/eventstore-mysql'
    },
    READMODELSTORE: {
        MySQL: __dirname + '/readmodelstore-mysql'
    }
};
