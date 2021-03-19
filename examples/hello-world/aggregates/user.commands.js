const {
    USER_CREATED,
    USER_UPDATED
} = require('../events/users');

const {ConflictError} = require('../errors');

module.exports = {
    create: async (command, state, context) => {
        console.log('Create User Command', state);
        if(state.registered)
            throw new ConflictError('User already registered');

        return {
            type: USER_CREATED,
            payload: {name: command.payload.name}
        };
    },
    update: async (command, state, context) => {
        console.log('Update User Command', state);
        return {
            type: USER_UPDATED,
            payload: {name: command.payload.name}
        };
    }
};
