# Installation
Make sure you have at least **Node.js v14.0.0** installed
```sh
$ node --version
v14.0.0
```
Create a new project (or use an existing one)
```sh
$ mkdir hello-world
$ cd hello-world
$ npm init -y
```
Then install the Blackrik module
```sh
$ npm i blackrik
```

# Usage
```javascript
const Blackrik = require('blackrik');
const config = require('./config');

const blackrik = new Blackrik(config);
blackrik.start()
    .then(() => console.log('Blackrik started...'));
```

# Config
```javascript
// config.js

const Blackrik = require('blackrik');

module.exports = {
    aggregates: [
        {
            name: 'user',
            commands: require('./aggregates/user.commands'),
            projection: require('./aggregates/user.projection')
        }
    ],
    readModels: [
        {
            name: 'user',
            projection: require('./readModels/user.projection'),
            resolvers: require('./readModels/user.resolvers'),
        }
    ],
    sagas: [
        {
            name: 'user',
            source: require('./sagas/user'),
        }
    ],
    readModelStoreAdapters: {
        default: {
            module: Blackrik.ADAPTERS.READMODELSTORE.MySQL,
            args: {
                host: 'localhost',
                database: 'READ_MODEL_DATABASE',
                user: 'DATABASE_USER',
                password: 'DATABASE_PASSWORD'
            }
        }
    },
    eventStoreAdapter: {
        module: Blackrik.ADAPTERS.EVENTSTORE.MySQL,
        args: {
            host: 'localhost',
            database: 'EVENT_STORE_DATABASE',
            user: 'DATABASE_USER',
            password: 'DATABASE_PASSWORD'
        }
    },
    eventBusAdapter: {
        module: Blackrik.ADAPTERS.EVENTBUS.Kafka,
        args: {
            brokers: ['localhost:9092']
        }
    }
};
```
See [config](Config#Introduction) for details.