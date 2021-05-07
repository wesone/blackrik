const {
    USER_CREATED,
    USER_UPDATED,
    USER_REJECTED
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
    }),
    [USER_REJECTED]: state => ({
        ...state,
        removed: true
    })
};
