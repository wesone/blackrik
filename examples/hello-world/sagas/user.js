const {USER_CREATED} = require('../events/users');

const tableName = 'RegisteredUsers';

module.exports = {
    handlers: {
        init: async store => {
            await store.defineTable(tableName, {
                email: {
                    type: 'string',
                    primaryKey: true,
                }
            });
            return {
                noopSideEffectsOnReplay: true
            };
        },
        [USER_CREATED]: async (store, {aggregateId, payload: {email, name}}, sideEffects) => {
            if(await store.findOne(tableName, {email}))
                return await sideEffects.executeCommand({
                    aggregateName: 'user',
                    aggregateId,
                    type: 'reject',
                    payload: {
                        reason: 'email address already taken'
                    }
                });
            await store.insert(tableName, {email});
            await sideEffects.sendRegistrationMail(email, name);
        }
    },
    sideEffects: {
        sendRegistrationMail: async (email, name) => {
            console.log(`Sending an email to "${name} <${email}>"...`);
        }
    }
};
