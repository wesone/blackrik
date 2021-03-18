module.exports = Object.freeze({
    READMODEL_INIT_FUNCTION: 'init',
    DEFAULT_ADAPTER: 'default',

    ROUTE_COMMAND: '/commands',
    ROUTE_QUERY: '/query/:readModel/:resolver',

    EVENT_LIMIT_REPLAY: 1000,
    EVENT_LIMIT_AGGREGATE: 100000
});
