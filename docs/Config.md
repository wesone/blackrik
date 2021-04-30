# Introduction
To create a new Blackrik instance you have to provide a config.  
Optionally you can provide multiple configs that will be merged.  
Examples: `new Blackrik(config)`, `new Blackrik(config1, config2)`.  
A config can have the following properties:
```javascript
{
    aggregates: [],
    readModels: [],
    sagas: [],
    adapter: 'default',
    readModelStoreAdapters: {},
    eventStoreAdapter: {},
    eventBusAdapter: {},
    contextProvider: () => ({}),
    server: {
        config: {},
        middlewares: [],
        routes: []
    }
}
```
# Reference
Property | Type | Attribute | Description
:--- | :--- | :--- | :---
[aggregates](Config#aggregates) | array | | An array of aggregate definitions
[readModels](Config#readModels) | array | | An array of read model definitions
[sagas](Config#sagas) | array | | An array of saga definitions
[adapter](Config#adapter) | string | optional<br>default: `'default'` | A read model adapter to be used by the framework
[readModelStoreAdapters](Config#readModelStoreAdapters) | object | | An object containing available read model store adapter definitions
[eventStoreAdapter](Config#eventStoreAdapter) | object | | An event store adapter definition
[eventBusAdapter](Config#eventBusAdapter) | object | | An event bus adapter definition
[contextProvider](Config#contextProvider) | function | optional | A function to create a custom context for commands and queries
[server](Config#server) | object | optional | An object containing additional properties for the server
[server.config](Config#config) | object | optional | A config used by the server
[server.middlewares](Config#middlewares) | array | optional | An array of middlewares for the server
[server.routes](Config#routes) | array | optional | An array of additional routes

# aggregates
An array of objects where each object represents an aggregate.  
Each aggregate needs to have a unique `name`, [commands](Aggregates#Commands) and a [projection](Aggregates#Projection).  

### Examples
```javascript
aggregates: [
    {
        name: 'user',
        commands: require('./aggregates/user.commands'),
        projection: require('./aggregates/user.projection')
    },
    {
        name: 'project',
        commands: require('./aggregates/project.commands'),
        projection: require('./aggregates/project.projection')
    }
]
```

# readModels
An array of objects where each object represents a read model.  
Each read model needs to have a unique `name` (that may be equal to a corresponding aggregate), a [projection](ReadModels#Projection) and [resolvers](ReadModel#Resolvers).  
The projection and the resolvers depend on a store that is accessed through an adapter (if your store is a MySQL database, you need an adapter to that database).
By default the adapter `'default'` will be used.  
You can reference any adapter from the [readModelStoreAdapters](Config#readModelStoreAdapters) object.

### Examples
```javascript
readModels: [
    {
        name: 'user',
        projection: require('./readModels/user.projection'),
        resolvers: require('./readModels/user.resolvers'),
    },
    {
        name: 'project',
        projection: require('./readModels/project.projection'),
        resolvers: require('./readModels/project.resolvers'),
        adapter: 'MyCustomAdapter'
    }
]
```

# sagas
An array of objects where each object represents a saga (also called process manager).  
Each saga needs to have a `name` (that may be equal to a corresponding aggregate) and a `source`.   
Just like [read models](Config#ReadModels), sagas depend on a store that is accessed through an adapter.  
By default the adapter `'default'` will be used.  
You can reference any adapter from the [readModelStoreAdapters](Config#readModelStoreAdapters) object.

### Examples
```javascript
sagas: [
    {
        name: 'user',
        source: require('./sagas/user'),
        adapter: 'default'
    }
]
```

# adapter
The framework needs a store for its core stuff (e.g. to persist [scheduled commands](Blackrik#schedulecommand)).  
The specified adapter needs to be the name of one of the stores from the [readModelStoreAdapters](#readModelStoreAdapters) object.  
By default the adapter `'default'` will be used. 

### Examples
```javascript
adapter: 'MyCustomAdapter'
```

# readModelStoreAdapters
An object that contains the read model store adapters that are available to the application. 
Each adapter has the properties `module` and `args`.  
Refer to [read model store adapter](ReadModelStoreAdapter) to see how to create a read model store adapter.

The property `module` is a string that contains the full path to the adapter (or just the name of the module if the module is a stand-alone package).

The property `args` will be used as a configuration for the adapter and its content will depend on the adapter.

### Examples
```javascript
readModelStoreAdapters: {
    default: {
        module: Blackrik.ADAPTERS.READMODELSTORE.MySQL
        args: {
            host: 'localhost',
            database: 'readmodelstore',
            user: process.env.READMODELSTORE_DATABASE_USER,
            password: process.env.READMODELSTORE_DATABASE_PASSWORD
        }
    },
    MyCustomAdapter: {
        module: __dirname + '/MyCustomAdapter'
    },
}
```

# eventStoreAdapter
An object that has the properties `module` and `args`.  
Refer to [event store adapter](EventStoreAdapter) to see how to create an event store adapter.

The property `module` is a string that contains the full path to the adapter (or just the name of the module if the module is a stand-alone package).

The property `args` will be used as a configuration for the adapter and its content will depend on the adapter.

### Examples
```javascript
eventStoreAdapter: {
    module: Blackrik.ADAPTERS.EVENTSTORE.MySQL
    args: {
        host: 'localhost',
        database: 'eventstore',
        user: process.env.EVENTSTORE_DATABASE_USER,
        password: process.env.EVENTSTORE_DATABASE_PASSWORD
    }
}
```

# eventBusAdapter
An object that has the properties `module` and `args`.  
Refer to [event bus adapter](EventBusAdapter) to see how to create an event bus adapter.

The property `module` is a string that contains the full path to the adapter (or just the name of the module if the module is a stand-alone package).

The property `args` will be used as a configuration for the adapter and its content will depend on the adapter.

### Examples
```javascript
eventBusAdapter: {
    module: Blackrik.ADAPTERS.EVENTBUS.Kafka
    args: {
        brokers: ['localhost:9092']
    }
}
```

# contextProvider
An optional function to create a custom context to use inside [commands](Aggregates#Commands) and [queries](ReadModels#Resolvers).  
The function receives the `req` object (just like [routes](#routes) and [middlewares](#middlewares)) which may be `null` if the command or query was not called by the HTTP API.  
The function should return an object that holds infos or helper functions. Reserved properties (e.g. `causationEvent`) may be overridden.

### Examples
```javascript
contextProvider: (req = null) => ({
    user: req?.user ?? 'system'
})
```

# server
Blackrik utilizes [Express](https://expressjs.com/) as a server and you are able to affect the creation of the server by using the `server` property.

### Examples
```javascript
server: {
    config: {
        port: 3000,
        skipDefaultMiddlewares: false
    },
    middlewares: [
        (req, res, next) => next(),
        [
            '/middleware/test',
            (req, res, next) => next(),
            (req, res, next) => next()
        ]
    ],
    routes: [
        {
            method: 'GET',
            path: '/test',
            callback: (req, res) => {
                console.log('CALLED /test');
            }
        }
    ]
}
```

## config
An object that acts as a config for the server creation.

### Properties
Name | Type | Attribute | Description
:--- | :--- | :--- | :---
port | int | default: `3000` | The port the server listens on. If the port is `0`, the operating system will assign an arbitrary unused port
skipDefaultMiddlewares | boolean | optional<br>default: `false` | By default Blackrik will add the middlewares [Helmet](https://www.npmjs.com/package/helmet) and [compression](https://www.npmjs.com/package/compression) to the server. You can prevent this by using<br>`skipDefaultMiddlewares: true`

## middlewares
An array where each entry represents an [Express](https://expressjs.com/) middleware.  
A middleware can either be a `function` or an array of the form `[path: string, ...functions: function]` (to execute a middleware or multiple middlewares only if a specific path was requested).

## routes
An array of objects where each object represents a route.  

### Properties
Name | Type | Attribute | Description
:--- | :--- | :--- | :---
method | string | | The HTTP method to use for a request to this route (`all` is also allowed to use every HTTP method, see [HTTP methods](Blackrik#HTTP_METHODS))
path | string \| array | | The path or an array of paths to request (it may contain a pattern e.g. `/user/:id` will match `/user/42`, `/user/21`, ...)
callback | function | | The callback to execute if the `path` was requested using the HTTP method in `method`
