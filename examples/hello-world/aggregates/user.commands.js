const {
    USER_CREATED,
    USER_UPDATED,
    USER_REJECTED
} = require('../events/users');

const {
    ConflictError,
    BadRequestError,
    ForbiddenError
} = require('../errors');

module.exports = {
    create: async (command, state/* , context */) => {
        if(state.registered)
            throw new ConflictError('User already registered');
        if(!command.payload.email)
            throw new BadRequestError('Please provide an email address');
        if(!command.payload.name)
            throw new BadRequestError('Please provide a name');

        return {
            type: USER_CREATED,
            payload: {
                email: command.payload.email,
                name: command.payload.name
            }
        };
    },
    update: async (command, state/* , context */) => {
        if(!state.registered || state.removed)
            throw new ForbiddenError();
        if(!command.payload.name)
            throw new BadRequestError('Please specify a new name');
        if(command.payload.name === state.name)
            throw new BadRequestError(`Name is already set to '${state.name}'`);

        return {
            type: USER_UPDATED,
            payload: {name: command.payload.name}
        };
    },
    reject: async (command/* , state, context */) => {
        return {
            type: USER_REJECTED,
            payload: command.payload
        };
    }
};
