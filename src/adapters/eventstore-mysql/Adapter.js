const EventStoreAdapterInterface = require('../EventStoreAdapterInterface');
const mysql = require('mysql2/promise');
const yup = require('yup');

class Adapter extends EventStoreAdapterInterface
{
    config;
    db;

    constructor(config)
    {
        super();
        this.config = config;
        this.validateConfig();
    }

    validateConfig()
    {
        console.log('validateConfig');
        if(!this.config)
            throw Error('EventStore-MySQL needs a config.');
        if(!this.config.host || !this.config.host.length)
            throw Error('EventStore-MySQL needs a host.');
        if(!this.config.database || !this.config.database.length)
            throw Error('EventStore-MySQL needs a database name.');
        if(!this.config.user || !this.config.user.length)
            throw Error('EventStore-MySQL needs a username.');
        if(!this.config.password || !this.config.password.length)
            throw Error('EventStore-MySQL needs a password.');
    }

    async init()
    {
        console.log('init');
        await this.createDatabase(await this._createConnection());    
        this.db = await mysql.createConnection(this.config);
        await this.db.connect();
        await this.createTable();
        // see https://github.com/sidorares/node-mysql2/issues/1239
        //========MySQL 8.0.22 (and higher) fix========
        const originalExecute = this.db.execute.bind(this.db);
        this.db.execute = function(...args){
            const [query, substitutions, ...rest] = args;
            for(const key in substitutions) // array or object
            {
                const value = substitutions[key];
                if(typeof value === 'number')
                    substitutions[key] = String(value);
            }
            return originalExecute(query, substitutions, ...rest);
        };
        //========/========
    }

    async save(event)
    {
        await this.db.execute(
            `INSERT INTO events (${Object.keys(event).join(',')}) VALUES (${Object.keys(event).map(() => '?').join(',')})`,
            Object.values(event));
    }

    async load(filter)
    {
        console.log('load');
        // execute can't handle arrays as placeholder, see https://github.com/sidorares/node-mysql2/issues/476
        const values = [];
        filter.aggregateIds.forEach(aggregateId => values.push(aggregateId));
        filter.types.forEach(type => values.push(type));
        values.push(filter.since);
        values.push(filter.until);
        values.push(filter.limit);
        values.push(filter.limit * (filter.cursor));
        const events = await this.db.execute(
            `SELECT * FROM events WHERE aggregateId IN (${filter.aggregateIds.map(() => '?').join(',')}) AND type IN (${filter.types.map(() => '?').join(',')}) AND (timestamp >= ? AND timestamp < ?) ORDER BY position ASC LIMIT ? OFFSET ?`,
            values
        );
        return { events: events[0], cursor: filter.cursor };
    }

    async createTable()
    {
        console.log('createTable');
        const exists = await this.db.execute(
            'SELECT count(*) FROM information_schema.TABLES WHERE (TABLE_SCHEMA = ?) AND (TABLE_NAME = \'events\')',
            [this.config.database]
        );

        if(exists[0][0]['count(*)'])
        {
            // TODO validate scheme
        }
        else
        {
            const fields = [
                'id VARCHAR(36) NOT NULL',
                'position BIGINT UNIQUE NOT NULL AUTO_INCREMENT',
                'aggregateId VARCHAR(36) NOT NULL',
                'aggregateVersion INT NOT NULL',
                'type VARCHAR(32) NOT NULL',
                'timestamp BIGINT NOT NULL',
                'correlationId VARCHAR(36) NOT NULL',
                'causationId VARCHAR(36)',
                'payload TEXT NOT NULL',
                'PRIMARY KEY (id)',
                'UNIQUE KEY `streamId` (aggregateId,aggregateVersion)'
            ];
            await this.db.execute(
                `CREATE TABLE events (${fields.join(',')})`,
                fields
            );
        }
    }

    async createDatabase(db)
    {
        console.log('createDatabase');
        await db.execute(
            `CREATE DATABASE IF NOT EXISTS ${this.config.database}`,
            []
        );
        await db.end();
    }

    async _createConnection(){
        return await mysql.createConnection(this.config);
    }

    async close()
    {
        await db.end();
    }
}

module.exports = Adapter;
