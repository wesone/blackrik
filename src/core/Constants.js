module.exports = Object.freeze({
    READMODEL_INIT_FUNCTION: 'init',
    DEFAULT_ADAPTER: 'default',

    ROUTE_COMMAND: '/commands',
    ROUTE_QUERY: '/query/:readModel/:resolver',

    EVENT_LIMIT_REPLAY: 1000,
    EVENT_LIMIT_AGGREGATE: 100000,

    EVENT_HANDLER_TABLE_NAME: '__META',

    COMMAND_SCHEDULER_TABLE_NAME: '__SCHEDULED_COMMANDS'
});
