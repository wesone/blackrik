const {USER_CREATED} = require('../events/users');

module.exports = {
    create: async (command, state, context) => {
        console.log('Create User Command', command, state, context);
        return {
            type: USER_CREATED,
            correlationId: '0',
            causationId: '0',
            payload: {}
        };
    }
};
