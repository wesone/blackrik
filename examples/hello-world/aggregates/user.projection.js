const {
    USER_CREATED,
    USER_EMAIL_ADDRESS_CHANGED,
    USER_NAME_CHANGED,
    USER_REJECTED
} = require('../events/users');

module.exports = {
    init: () => ({}),
    [USER_CREATED]: (state, {payload}) => ({
        ...state,
        ...payload,
        registered: true
    }),
    [USER_EMAIL_ADDRESS_CHANGED]: (state, {payload}) => ({
        ...state,
        ...payload
    }),
    [USER_NAME_CHANGED]: (state, {payload}) => ({
        ...state,
        ...payload
    }),
    [USER_REJECTED]: state => ({
        ...state,
        removed: true
    })
};
