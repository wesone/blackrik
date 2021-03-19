const {
    USER_CREATED,
    USER_UPDATED,
} = require('../events/users');

module.exports = {
    init: () => ({}),
    [USER_CREATED]: (state, {payload}) => ({
        ...state,
        ...payload,
        registered: true
    }),
    [USER_UPDATED]: (state, {payload}) => ({
        ...state,
        ...payload
    })
};
