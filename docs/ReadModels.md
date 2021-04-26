# Introduction
A read model is used to efficiently query the current state of the system (e.g. what is the current name of a user).  
To achieve this, the read model listens to the events created by commands and updates a [store](ReadModelStoreAdapter) accordingly.  
While a command is just a request to change the state, an event is an actual state change that should be reflected inside the persistence level of the read model.

# Projection
The projection listens to events and may update the read model's "state".  
However unlike the aggregate projection, the read model projection persists the state for efficient reading.

## init
To prepare the persistence, a projection can have a function called `init` that receives the `store` that is used to create tables or update their schemes.  

## Callback
Each callback function should use the `event` to update the `store`

### Parameters
Name | Type | Attribute | Description
:--- | :--- | :--- | :---
store | object | | An instance of a [read model store adapter](ReadModelStoreAdapter)
event | object | | The event

Example:
```javascript
module.exports = {
    init: async store => {
        await store.defineTable('Users', {
            id: {
                type: 'uuid',
                primaryKey: true
            },
            email: 'string',
            name: 'string',
            createdAt: 'date',
            updatedAt: 'date'
        });
    },
    'USER_CREATED': async (store, event) => {
        const createdAt = new Date(event.timestamp);
        await store.insert(
            'Users',
            {
                id: event.aggregateId,
                email: event.payload.email,
                name: event.payload.name,
                createdAt,
                updatedAt: createdAt
            }
        );
    },
    'USER_UPDATED': async (store, {aggregateId: id, timestamp, payload: {name}}) => {
        await store.update(
            'Users',
            {id}, 
            {
                name,
                updatedAt: new Date(timestamp)
            }
        );
    }
};
```

# Resolvers
Resolvers process the actual queries.

## Callback
Every callback function will operate on the same store as the projection does.

### Parameters
Name | Type | Attribute | Description
:--- | :--- | :--- | :---
store | object | | An instance of a [read model store adapter](ReadModelStoreAdapter)
args | object | | An object containing the arguments to perform the query
context | object | | An object that contains [additional information or helper functions](#Context)

### Return 
The callback returns the result of the query

## Context
The context is an object that contains additional information or functions.  
Custom properties can be added with the [contextProvider](Config#contextProvider)

Property | Type | Attribute | Description
:--- | :--- | :--- | :---
 |  |  | 

Example:
```javascript
module.exports = {
    get: async (store, args, context) => {
        return await store.findOne('Users', {id: args.id});
    },
    list: async (store, {ids}, context) => {
        return await store.find('Users', {
            id: {
                $or: ids
            }
        });
    }
};
```