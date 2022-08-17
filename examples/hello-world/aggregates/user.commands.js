const {
    USER_CREATED,
    USER_EMAIL_ADDRESS_CHANGED,
    USER_NAME_CHANGED,
    USER_REJECTED
} = require('../events/users');

const {
    DuplicateAggregateError,
    ConflictError,
    NotFoundError,
    BadRequestError,
    ForbiddenError,
    UnalteredError
} = require('blackrik').ERRORS;

module.exports = {
    create: async (command, state, context) => {
        if(context.aggregateVersion && !state.registered)
            throw new DuplicateAggregateError();
        if(state.registered)
            throw new ConflictError('User already registered');
        if(state.removed)
            throw new ForbiddenError();
        
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
    setEmailAddress: async (command, state/* , context */) => {
        if(!state.registered)
        throw new NotFoundError();
        
        if(!command.payload.email)
        throw new BadRequestError('Please provide a new email address');
        if(command.payload.email === state.email)
        throw new UnalteredError(`Current email address is already ${command.payload.email}`)
        
        return {
            type: USER_EMAIL_ADDRESS_CHANGED,
            payload: {
                email: command.payload.email
            }
        };
    },
    setName: async (command, state/* , context */) => {
        if(!state.registered)
            throw new NotFoundError();

        if(!command.payload.name)
            throw new BadRequestError('Please provide a new name');
        if(command.payload.name === state.name)
            throw new UnalteredError(`Current name is already ${command.payload.name}`)

        return {
            type: USER_NAME_CHANGED,
            payload: {
                name: command.payload.name
            }
        };
    },
    reject: async (command/* , state, context */) => {
        return {
            type: USER_REJECTED,
            payload: command.payload
        };
    }
};
