# Introduction
The event store is a place where all events are persisted.

Every adapter needs to expose a function that takes an options object as argument and returns an object (or a class instance) with the following functions.

# Reference
Visibility | Property
:---: | :---
public |     async [init](EventStoreAdapter#init)()<br>Initializes the adapter
public |     async [save](EventStoreAdapter#save)(event: object): int \| false<br>Saves an event
public |     async [load](EventStoreAdapter#load)(filter: object): object<br>Loads events
public |     async [delete](EventStoreAdapter#delete)(aggregateId: string): number<br>Removes every event of the specified aggregate id
public |     async [close](EventStoreAdapter#close)()<br>Closes the event store

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
The `position` (number) of the event inside the event store or `false` if the new position of the event is already taken (conflict).

### Examples
```javascript
const position = await eventStore.save({
    id: 'b42e61d5-e911-4ea8-92fd-57ceb552e712',
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
reverse | boolean | optional<br>default: `false` | To reverse the order of the events
cursor | mixed \| null | optional | A cursor to scroll the result if a limit was used

### Return
An `object` containing the keys `events` and `cursor`.  

Property | Type | Attribute | Description
:--- | :--- | :--- | :---
events | array | | An array that contains the matching events
cursor | mixed | | A cursor that can be passed to another call to `load` to scroll the result

An event that was loaded contains the additional property `position` that was given to the event during [save](#save).  
So an event may look like this:
```json
{
    "id": "b42e61d5-e911-4ea8-92fd-57ceb552e712",
    "position": 423,
    "aggregateId": "4233fb22-76eb-4b8f-9b34-8fdcb994e370",
    "aggregateVersion": 0,
    "type": "ANSWER_CREATED",
    "timestamp": 123456789,
    "correlationId": "4233fb22-76eb-4b8f-9b34-8fdcb994e370",
    "causationId": null,
    "payload": {
        "answer": 42
    }
}
```

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

# delete
`async delete(aggregateId: string): number`  
Deletes all events that belong to the specified aggregate id.

### Parameters
Name | Type | Attribute | Description
:--- | :--- | :--- | :---
aggregateId | string | | The aggregate id

### Return
The `amount` (number) of events that were deleted.

### Examples
```javascript
const eventCount = await eventStore.delete('4233fb22-76eb-4b8f-9b34-8fdcb994e370');
```

# close
`async close()`  
Securely closes all open connections to the database server.
