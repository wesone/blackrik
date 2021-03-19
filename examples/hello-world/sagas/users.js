const {USER_CREATED} = require('../events/users');

module.exports = {
    handlers: {
        init: async store => {},
        [USER_CREATED]: async (store, event, sideEffects) => {
            console.log('Saga executed', event);
            sideEffects.test();
        }
    },
    sideEffects: {
        test: () => {
            console.log('Executed Sideeffect');
        }
    }
};
