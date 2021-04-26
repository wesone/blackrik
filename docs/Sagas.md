# Introduction
Sagas (also called process managers) are independent components that listen for events and execute business logic. They can execute so called "[side effects](#SideEffects)" such as executing or scheduling other commands, calling external web-services or sending emails.

A saga has a [handlers](#Handlers) object and a [sideEffects](#SideEffects) object.  
The side effects object contains functions that the handlers can use (e.g. send an email to a user).  
The reason why handlers and side effects are seperated is because during a replay, handlers will be called but side effects should not.  
An example:  
- A user was registered and a `USER_REGISTERED` event was send  
- A saga listens for that event and will send a registration email to the user
- Someday the user read model changes (e.g. a new field was added to the database scheme) and all user events will be replayed
- The saga will see the old `USER_REGISTERED` event and should NOT send an email to the user again

Example:
```javascript
module.exports = {
    handlers: {
        init: async store => {
            await store.defineTable('EmailAddresses', {
                email: {
                    type: 'string',
                    primaryKey: true
                }
            });
            return {
                noopSideEffectsOnReplay: true
            };
        },
        'USER_CREATED': async (store, event, sideEffects) => {
            const email = event.payload.email;
            if(!await store.findOne('EmailAddresses', {email}))
                sideEffects.sendRegistrationMail(email);
        }
    },
    sideEffects: {
        sendRegistrationMail: email => {
            console.log('Send registration email to', email);
        }
    }
};
```

## Workflows
If more complexity is needed, the saga may export a [workflow](Workflows) instead of `{handlers: {}, sideEffects: {}}`.  
Workflows act as a state machine and can be used to model more complex business logic.

# Handlers
The handlers listen to events, update their state (if needed) and execute business logic.

## init
To prepare the saga persistence, the handlers can have a function called `init` that receives the `store` that is used to create tables or update their schemes.  

### Return
init can optionally return an object that holds a config

Property | Type | Attribute | Description
:--- | :--- | :--- | :---
noopSideEffectsOnReplay | boolean | optional<br>default: `true` | In case the tables of the projection do not exist yet or their scheme changed, all events the handlers listen for will be replayed. The replay will cause the handlers to be executed even though the events aren't new. In that case all side effects will be transformed to no-operation functions (actually empty functions that will do nothing). To make side effects execute normally use<br>`noopSideEffectsOnReplay: false`

# SideEffects
The side effects are just a bunch of user defined functions that the handlers can call. These functions will only execute if the handler (that calls the side effect) processes a new event. If the exact same event was just replayed, the handler executes normally but the side effect will do nothing.

There are default side effects that are available:

Property | Type | Attribute | Description
:--- | :--- | :--- | :---
[executeCommand](Blackrik#executeCommand) | function | | Calls a command
[scheduleCommand](Blackrik#scheduleCommand) | function | | Delays a command execution

Events that will be created by using the default side effects will be linked to the event that caused them.  
For example:
- The saga will be executed because of event A
- The saga uses executeCommand (or scheduleCommand)
- The command will create event B
- Event B will be linked to event A (like B is a child of A)