# Introduction
The event store is a place where all events are persisted.

Every adapter needs to expose a function that takes an options object as argument and returns an object (or a class instance) with the following functions.

# Reference
Visibility | Property
:---: | :---
public |     async [init](EventStoreAdapter#init)()<br>Initializes the adapter
public |     async [save](EventStoreAdapter#save)(event: object): int \| false<br>Saves an event
public |     async [load](EventStoreAdapter#load)(filter: object): object<br>Loads events

# init
`async init()`  
Initializes the adapter.

# save
`async save(event: object): int | false`  
Saves the event passed to it.

### Parameters
Name | Type | Attribute | Description
:--- | :--- | :--- | :---
event | object | | The event to be saved

### Return
The position of the event inside the event store or `false` if the new position of the event is already taken (conflict).

### Examples
```javascript
const position = await eventStore.save({
    aggregateId: '4233fb22-76eb-4b8f-9b34-8fdcb994e370',
    aggregateVersion: 0,
    type: 'ANSWER_CREATED',
    timestamp: Date.now(),
    correlationId: '4233fb22-76eb-4b8f-9b34-8fdcb994e370',
    causationId: null,
    payload: {
        answer: 42
    }
});
```

# load
`async load(filter: object): object`  
Loads all events from the event store that match the passed filter.

### Parameters
Name | Type | Attribute | Description
:--- | :--- | :--- | :---
filter | object | | An object containing [conditions](#Filter)

### Filter
Property | Type | Attribute | Description
:--- | :--- | :--- | :---
aggregateIds | array | optional | An array of strings with the desired aggregate IDs
types | array | optional | An array of strings with the desired event types
correlationIds | array | optional | An array of strings with the desired correlation IDs
causationIds | array | optional | An array of strings with the desired causation IDs
since | int | optional | To exclude events with a `timestamp` < `since`
until | int | optional | To exclude events with a `timestamp` >= `until`
limit | int | optional | To limit the number of returned events
cursor | mixed \| null | optional | A cursor to scroll the result if a limit was used

### Return
An `object` containing the keys `events` and `cursor`.  

Property | Type | Attribute | Description
:--- | :--- | :--- | :---
events | array | | An array that contains the matching events
cursor | mixed | | A cursor that can be passed to another call to `load` to scroll the result

### Examples
```javascript
const {events, cursor} = await eventStore.load({
    aggregateIds: [
        '4233fb22-76eb-4b8f-9b34-8fdcb994e370'
    ],
    types: [
        'ANSWER_CREATED',
        'ANSWER_UPDATED'
    ],
    since: Date.now() - 1000*60*60*24,
    until: Date.now(),
    limit: 5,
    cursor: null
});
```

# close
`async close(): boolean`  
Securely closes all open connections to the database server.

### Return
`true` if the connections were closed successfully. Otherwise it throws an error.

### Examples
```javascript
await eventStore.close();
```
