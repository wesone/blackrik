const {
    USER_REGISTERED,
    USER_UPDATED,
    USER_REJECTED
} = require('../events/users');

const {
    ConflictError,
    BadRequestError,
    ForbiddenError
} = require('../errors');

const bcrypt = require('bcrypt');
const saltRounds = 10;

module.exports = {
    register: async (command, state/* , context */) => {
        if(state.registered)
            throw new ConflictError('User already registered');
        if(!command.payload.email)
            throw new BadRequestError('Please provide an email address');
        if(!command.payload.name)
            throw new BadRequestError('Please provide a name');
        if(!command.payload.password)
            throw new BadRequestError('Please provide a password');

        return {
            type: USER_REGISTERED,
            payload: {
                email: command.payload.email,
                name: command.payload.name,
                password: await bcrypt.hash(command.payload.password, saltRounds)
            }
        };
    },
    update: async (command, state/* , context */) => {
        if(!state.registered || state.removed)
            throw new ForbiddenError();

        const {name, password} = command.payload;
        if(!name && !password)
            throw new BadRequestError('Please specify a new name and/or a new password');
        if(name && name === state.name)
            throw new BadRequestError(`Name is already set to '${state.name}'`);

        const payload = {};
        if(name)
            payload.name = name;
        if(password)
            payload.password = await bcrypt.hash(password, saltRounds);

        return {
            type: USER_UPDATED,
            payload
        };
    },
    reject: async (command/* , state, context */) => {
        return {
            type: USER_REJECTED,
            payload: command.payload
        };
    }
};
