# Introduction
An aggregate represents a state of a single unit inside your system (e.g. user).  
It consists of a name, [commands](#Commands) and a [projection](#Projection).
A specific instance of an aggregate (e.g. an actual user) is identified by `aggregateId`.

# Commands
A command is a request to change/update an aggregate's state (e.g. update the user's name).  
It can be triggered through the [HTTP API](HTTP-API#Commands) or programmatically through [executeCommand](Blackrik#executeCommand).

## Callback
The actual callback that will be executed will receive 3 parameters.  
To reject a command (e.g. in case the validation of the payload failed) the callback can throw an [exception](Blackrik#ERRORS)

### Parameters
Name | Type | Attribute | Description
:--- | :--- | :--- | :---
command | object | | The [command](#Command) to be processed by the callback
state | object | | The calculated state that is created with the help of the aggregate's [projection](#Projection) and that is based on all events that belong to the aggregate id
context | object | | An object that contains [additional information or helper functions](#Context)

### Return
The callback may return an [event](#Event).

## Command
The command object contains the following properties:

Property | Type | Attribute | Description
:--- | :--- | :--- | :---
aggregateName | string | | The name of the aggregate
aggregateId | string | | The aggregate id to identify an aggregate instance
type | string | | The name of the command to execute
timestamp | int | | The timestamp of the command issuing
payload | mixed | optional<br>default: `null` | An optional payload that contains options or arguments for the command

## Context
The context is an object that contains additional information or functions.  
Custom properties can be added with the [contextProvider](Config#contextProvider)

Property | Type | Attribute | Description
:--- | :--- | :--- | :---
aggregateVersion | number | `0` <small>for a new aggregate id</small> | A number indicating the amount of events that belong to the aggregate
latestEventPosition | number \| null | `null` <small>for a new aggregate id</small> | The position of the latest event inside the event store that belongs to the aggregate
causationEvent | object | optional | An event that caused this command. If the command returns a new event, the causationEvent will be the events "parent"

## Event
The object that may be returned by the command's callback initiates a new event.  
That event will automatically be assigned to the aggregate id and will be populated with additional information (timestamp, aggregateVersion, ...)

Property | Type | Attribute | Description
:--- | :--- | :--- | :---
type | string | | The type of event
payload | object | optional<br>default: `null` | An optional payload that contains additional information for the event

### Tombstone event
There is a special event called *Tombstone event*. If a command returns an event with the type `TOMBSTONE`, it will automatically erase all events inside the event store that belong to the aggregate id of this event. [More information on why this exists](SensitiveData).

## Examples
```javascript
module.exports = {
    create: async (command, state, context) => {
        if(state.registered)
            throw new ConflictError('User already registered');

        const {payload} = command;

        if(!payload.email)
            throw new BadRequestError('Please give us your email address, so we can send spam');
        if(!payload.name)
            throw new BadRequestError('Please give us your name');

        return {
            type: 'USER_CREATED',
            payload
        };
    },
    updateName: async ({payload}, state, context) => {
        if(!state.registered)
            throw new NotFoundError();
        if(!payload.name)
            throw new BadRequestError('Please give us your real name');
        if(payload.name === state.name)
            throw new UnalteredError('There are no changes');

        return {
            type: 'USER_NAME_UPDATED',
            payload
        };
    },
    requestGDPRDeletion: async (command, state, context) => {
        if(!state.registered)
            throw new NotFoundError();

        return {
            type: 'TOMBSTONE',
            payload: {
                reason: 'GDPR request'
            }
        }
    }
};
```

# Projection
The projection will reduce all events that belong to the aggregate id and the resulting state will be passed to the command's callback.  
To achieve this, the projection contains a function for each event type of the aggregate (that actually affects the state).  
The function will receive the previous state and the event and returns the new state.  
A projection can also have a function called `init` that returns a starting state. Without an init-function the first state will be an empty object (`{}`).

## Examples
```javascript
module.exports = {
    init: () => ({
        registered: false
    }),
    'USER_CREATED': (state, event) => ({
        ...state,
        ...event.payload,
        registered: true
    }),
    'USER_UPDATED': (state, {payload}) => ({
        ...state,
        ...payload
    })
};
```
