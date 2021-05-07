const {
    USER_CREATED,
    USER_UPDATED,
    USER_REJECTED,
    USER_MAIL_CHANGE_REVERTED
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
        if(!command.payload.name && !command.payload.email)
            throw new BadRequestError('Please specify a new name and/or email address');
        if(command.payload.name === state.name)
            throw new BadRequestError(`Name is already set to '${state.name}'`);
        if(command.payload.email === state.email)
            throw new BadRequestError(`Email address is already set to '${state.email}'`);

        return {
            type: USER_UPDATED,
            payload: {
                name: command.payload.name ?? state.name,
                email: command.payload.email ?? state.email 
            }
        };
    },
    reject: async (command/* , state, context */) => {
        return {
            type: USER_REJECTED,
            payload: command.payload
        };
    },
    restoreEmailAddress: async (command, state/*, context */) => {
        if(!state.registered || state.removed)
            throw new ForbiddenError();
        return {
            type: USER_MAIL_CHANGE_REVERTED,
            payload: {},
        };
    }
};
