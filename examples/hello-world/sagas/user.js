const {USER_CREATED} = require('../events/users');

module.exports = {
    handlers: {
        init: async (/* store */) => {
            return {
                noopSideEffectsOnReplay: true
            };
        },
        [USER_CREATED]: async (/* store,  */event, sideEffects) => {
            console.log('Saga executed', event.id);
            sideEffects.test();
            await sideEffects.executeCommand({
            // await sideEffects.scheduleCommand(event.timestamp + 1000*10, {
                aggregateName: 'user',
                aggregateId: event.aggregateId,
                type: 'update',
                payload: {
                    'name': `${event.payload.name} Lastname`
                }
            });
        }
    },
    sideEffects: {
        test: () => {
            console.log('Executed Sideeffect');
        }
    }
};
