const {
    USER_CREATED,
    USER_UPDATED,
} = require('../events/users');

module.exports = {
    init: () => ({}),
    [USER_CREATED]: (state, event) => ({
        ...state
    }),
    [USER_UPDATED]: (state, {payload}) => ({
        ...state,
        ...payload
    })
};
