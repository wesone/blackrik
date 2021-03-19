const EventStoreAdapterInterface = require('../EventStoreAdapterInterface');
const mysql = require('mysql2/promise');
// const databaseSchema = {
//     // 'id VARCHAR(36) NOT NULL',
//     // 'position BIGINT UNIQUE NOT NULL AUTO_INCREMENT',
//     // 'aggregateId VARCHAR(36) NOT NULL',
//     // 'aggregateVersion INT NOT NULL',
//     // 'type VARCHAR(32) NOT NULL',
//     // 'timestamp BIGINT NOT NULL',
//     // 'correlationId VARCHAR(36) NOT NULL',
//     // 'causationId VARCHAR(36)',
//     // 'payload TEXT NOT NULL',
//     // 'PRIMARY KEY (id)',
//     // 'UNIQUE KEY `streamId` (aggregateId,aggregateVersion)'
//     fields: {
//         id: {
//             Type: 'varchar'
//         }
//     },
//     options: {
//
//     }
// };

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
        if(!this.config)
            throw Error('EventStore-MySQL needs a config.');
        if(!this.config.host || !this.config.host.length)
            throw Error('EventStore-MySQL needs a host.');
        if(!this.config.port || !this.config.host.port)
            this.config.port = 3306;
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
        await this.createDatabase();
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
        const result = await this.db.execute(
            `INSERT INTO events (${Object.keys(event).join(',')}) VALUES (${Object.keys(event).map(() => '?').join(',')})`,
            Object.values(event));
        return result[0].insertId;
    }

    async load(filter)
    {
        // execute can't handle arrays as placeholder, see https://github.com/sidorares/node-mysql2/issues/476
        const values = [];
        const where = [];
        if(filter.aggregateIds)
        {
            filter.aggregateIds.forEach(aggregateId => values.push(aggregateId));
            where.push(`aggregateId IN (${filter.aggregateIds.map(() => '?').join(',')})`);
        }

        if(filter.types)
        {
            filter.types.forEach(type => values.push(type));
            where.push(`type IN (${filter.types.map(() => '?').join(',')})`);
        }

        if(filter.since)
        {
            values.push(filter.since);
            where.push('timestamp >= ?');
        }

        if(filter.until)
        {
            values.push(filter.until);
            where.push('timestamp < ?');
        }

        const limit = [];
        if(filter.limit)
        {
            values.push(filter.limit);
            limit.push('LIMIT ?');
            if(!filter.cursor === undefined)
            {
                values.push(filter.limit * (filter.cursor));
                limit.push('OFFSET ?');
            }
        }

        const events = await this.db.execute(`SELECT * FROM events WHERE ${where.join(' AND ')} ORDER BY position ASC ${limit.join(' ')}`, values);
        return {
            events: events[0].map(event => {
                event.payload = JSON.parse(event.payload);
                return event;
            }),
            cursor: filter.cursor
        };
    }

    async createTable()
    {
        const exists = await this.db.execute(
            'SELECT count(*) FROM information_schema.TABLES WHERE (TABLE_SCHEMA = ?) AND (TABLE_NAME = \'events\')',
            [this.config.database]
        );

        if(exists[0][0]['count(*)'])
        {
            // const table = await this.db.execute('DESCRIBE events', []);
            // console.log(table[0]);
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
        console.log('PRE db sagt: ', db);
        if(!db)
        {
            db = await mysql.createConnection({
                host: this.config.host,
                port: this.config.port,
                user: this.config.user,
                password: this.config.password,
            });
        }

        console.log('POST db sagt: ', db);
        await db.execute(
            `CREATE DATABASE IF NOT EXISTS ${this.config.database}`,
            []
        );
        await db.end();
    }

    async close()
    {
        await this.db.end();
    }
}

module.exports = Adapter;
