const {USER_CREATED} = require('../events/users');

module.exports = {
    init: async store => {},
    [USER_CREATED]: async (store, event) => {
        console.log('ReadModel projection executed', event);
    }
};
