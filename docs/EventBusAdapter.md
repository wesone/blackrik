# Introduction
An event bus is used to handle messaging. It can be used to send events across multiple servers.
 
Every adapter needs to expose a function that takes an options object as argument and returns an object (or a class instance) with the following functions.

# Reference
Visibility | Property
:---: | :---
public |     async [init](EventBusAdapter#init)()<br>Initializes the adapter
public |     async [start](EventBusAdapter#start)()<br>Starts the event bus
public |     async [stop](EventBusAdapter#stop)()<br>Stops the event bus
public |     async [subscribe](EventBusAdapter#subscribe)(name: string, type: string, callback: function)<br>Subscribes to an event
public |     async [publish](EventBusAdapter#publish)(name: string, event: object): boolean<br>Publishes an event

# init
`async init()`  
Initializes the adapter.

# start
`async start()`  
Starts the event bus. This will be executed after all subscribers called `subscribe`.

# stop
`async stop()`  
Stops the event bus. Connections to underlying systems should be closed.

# subscribe
`async subscribe(name: string, type: string, callback: function)`  
Add a listener function.

### Parameters
Name| Type | Attribute | Description
:--- | :--- | :--- | :---
name | string | | The aggregate name of the event
type | string | | The event type to listen for
callback | function | | The callback to be executed. The callback will receive the event as the first parameter

### Examples
```javascript
await eventBus.subscribe('User', 'USER_CREATED', event => {
    console.log('User was created', event);
});
```

# publish
`async publish(name: string, event: object): boolean`  
Publishes an event that needs to be passed to the subscribers.

### Parameters
Name| Type | Attribute | Description
:--- | :--- | :--- | :---
name | string | | The aggregate name of the event
event | object | | The event to publish

### Return
`true` if the event was published, otherwise `false`

### Examples
```javascript
const success = await eventBus.publish('User', {
    aggregateId: '219de538-9936-4362-b29f-c5f57768f342',
    aggregateVersion: 0,
    type: 'USER_CREATED',
    timestamp: Date.now(),
    correlationId: '219de538-9936-4362-b29f-c5f57768f342',
    causationId: null,
    payload: {
        name: 'John Doe'
    }
});
```
