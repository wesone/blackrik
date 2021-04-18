# Reference
Visibility | Property
:---: | :---
public static |     [ADAPTERS](Blackrik#ADAPTERS)<br>An object with default adapters to use for read models, sagas, event store, event bus
public static |     [HTTP_METHODS](Blackrik#HTTP_METHODS)<br>Available HTTP methods to use inside [routes](Config#Routes) for custom API routes
public static |     [ERRORS](Blackrik#ERRORS)<br>An object containing default errors to throw
public |     [constructor](Blackrik#constructor)(...[configs](Config): object)
public |     async [start](Blackrik#start)()<br>Initializes the application and starts the server
public |     async [executeCommand](Blackrik#executeCommand)(command: object): boolean<br>Calls a command
public |     async [scheduleCommand](Blackrik#scheduleCommand)(timestamp: number, command: object): boolean<br>Delays a command execution
public |     async [executeQuery](Blackrik#executeQuery)(readModel: string, resolver: string, ?query: object): mixed<br>Performs a query on a resolver

# ADAPTERS
An object containing the default adapters that can be used inside read model store adapters, event store adapter, event bus adapter.
```javascript
{
    EVENTBUS: {
        Kafka
    },
    EVENTSTORE: {
        MySQL
    },
    READMODELSTORE: {
        MySQL
    }
}
```
Example:
```javascript
eventBusAdapter: {
    module: Blackrik.ADAPTERS.EVENTBUS.Kafka
    args: {
        brokers: ['localhost:9092']
    }
}
```

# HTTP_METHODS
An array that contains the available HTTP methods for the routes array. These are the same values used by [Express](https://expressjs.com).  
When used inside the routes array lower or upper case does not matter.
```javascript
[
    'head',
    'options',
    'get',
    'post',
    'put',
    'patch',
    'delete',
    'all'
]
```
Example:
```javascript
routes: [
    {
        method: 'GET',
        path: '/test',
        callback: (req, res) => {
            console.log('CALLED /test');
        }
    },
    {
        method: 'post',
        path: '/test2',
        callback: (req, res) => {
            console.log('CALLED /test2');
        }
    }
]
```

# ERRORS
An object containing default errors that can be used inside the application to throw the right exceptions.  
Each error has a `message` and a `status` (that represents a [HTTP status code](https://en.wikipedia.org/wiki/List_of_HTTP_status_codes)).  
You are free to provide a custom message to the constructor that overrides the default message.  
You can add a custom status to `BaseError` as the second parameter of the constructor.
```
BaseError // 500 Internal Error
BadRequestError // 400 Bad Request
UnauthorizedError // 401 Unauthorized
ForbiddenError // 403 Forbidden
NotFoundError // 404 Not Found
ConflictError // 409 Conflict
```
Example:
```javascript
const {BadRequestError, BaseError} = require('blackrik').ERRORS

if(!isValidRequest())
    throw new BadRequestError();
if(username.startsWith('42'))
    throw new BadRequestError('Usernames can not start with 42');
if(userWantsCoffee())
    throw new BaseError('I\'m a teapot', 418);
```

# constructor
`constructor(...configs: object)`  
Creates a new Blackrik instance based on the provided [config(s)](Config).  
Example:
```javascript
const Blackrik = require('blackrik');

blackrik = new Blackrik({
    // ...
});
```

# start
`async start()`  
Initializes the application and starts the server.

# executeCommand
`async executeCommand(command: object): boolean`  
Sends a command to an [aggregate](Aggregates#Introduction). 
 
### Parameters
Name| Type | Attribute | Description
:--- | :--- | :--- | :---
command | object | | The command to be executed

### Return
`true` if an event was created, otherwise `false`  
May throw an error

Example:
```javascript
try
{
    await executeCommand({
        aggregateName: 'User',
        aggregateId: uuid(),
        type: 'create',
        payload: {
            email: 'blackrik@example.com',
            name: 'Blackrik'
        }
    });
}
catch(e)
{
    console.error(e);
}
```
```javascript
// inside a saga
'USER_CREATED': async (store, {aggregateId, payload: {email}}, sideEffects) => {
    if(await store.findOne('emails', {email}))
        return await executeCommand({
            aggregateName: 'User',
            aggregateId,
            type: 'reject',
            payload: {
                reason: 'E-Mail address already taken'
            }
        });
    await store.insert('emails', {email});
}
```

# scheduleCommand
`async scheduleCommand(timestamp: number, command: object): boolean`  
Just like [executeCommand](#executeCommand), but it will execute the command at the specified timestamp.  
It is not guaranteed that the command will execute at the exact specified point in time.  
Under the hood scheduleCommand is implemented using [setTimeout](https://nodejs.org/api/timers.html#timers_settimeout_callback_delay_args).

### Return
`true` if the command was successfully scheduled.

# executeQuery
`async executeQuery(readModel: string, resolver: string, ?query: object): mixed`  
Executes a query on the [read model's](ReadModels#Introduction) [resolver](ReadModels#Resolver).

### Parameters
Name | Type | Attribute | Description
:--- | :--- | :--- | :---
readModel | string | | The read model name to execute the query on
resolver | string | | The name of the resolver of the read model
query | object | optional<br>default: `{}` | A query for the resolver

### Return
The result of the resolver  
May throw an error

Example:
```javascript
const response = await executeQuery('users', 'get', {id: 42});
```