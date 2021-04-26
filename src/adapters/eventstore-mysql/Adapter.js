const EventStoreAdapterInterface = require('../EventStoreAdapterInterface');
const mysql = require('mysql2/promise');
const databaseSchema = {
    fields: {
        id: {
            Field: 'id',
            Type: 'varchar(36)',
            Null: 'NO',
            Key: 'PRI',
            Default: null,
            Extra: ''
        },
        position: {
            Field: 'position',
            Type: 'bigint',
            Null: 'NO',
            Key: 'UNI',
            Default: null,
            Extra: 'auto_increment'
        },
        aggregateId: {
            Field: 'aggregateId',
            Type: 'varchar(36)',
            Null: 'NO',
            Key: 'MUL',
            Default: null,
            Extra: ''
        },
        aggregateVersion: {
            Field: 'aggregateVersion',
            Type: 'int',
            Null: 'NO',
            Key: '',
            Default: null,
            Extra: ''
        },
        type: {
            Field: 'type',
            Type: 'varchar(32)',
            Null: 'NO',
            Key: 'MUL',
            Default: null,
            Extra: ''
        },
        timestamp: {
            Field: 'timestamp',
            Type: 'bigint',
            Null: 'NO',
            Key: 'MUL',
            Default: null,
            Extra: ''
        },
        correlationId: {
            Field: 'correlationId',
            Type: 'varchar(36)',
            Null: 'NO',
            Key: 'MUL',
            Default: null,
            Extra: ''
        },
        causationId: {
            Field: 'causationId',
            Type: 'varchar(36)',
            Null: 'YES',
            Key: 'MUL',
            Default: null,
            Extra: ''
        },
        payload: {
            Field: 'payload',
            Type: 'text',
            Null: 'YES',
            Key: '',
            Default: null,
            Extra: ''
        }
    },
    options: {
        uniqueKey: {
            name: 'streamId',
            fields: ['aggregateId', 'aggregateVersion']
        }
    }
};

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
            values.push(...filter.aggregateIds);
            where.push(`aggregateId IN (${filter.aggregateIds.map(() => '?').join(',')})`);
        }

        if(filter.types)
        {
            values.push(...filter.types);
            where.push(`type IN (${filter.types.map(() => '?').join(',')})`);
        }

        if(filter.correlationIds)
        {
            values.push(...filter.correlationIds);
            where.push(`correlationId IN (${filter.correlationIds.map(() => '?').join(',')})`);
        }

        if(filter.causationIds)
        {
            values.push(...filter.causationIds);
            where.push(`causationId IN (${filter.causationIds.map(() => '?').join(',')})`);
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
            if(filter.cursor !== undefined)
            {
                values.push(filter.limit * filter.cursor);
                limit.push('OFFSET ?');
            }
        }
        const toExecute = `SELECT * FROM events WHERE ${where.join(' AND ')} ORDER BY position ASC ${limit.join(' ')}`;
        const events = await this.db.execute(toExecute, values);
        return {
            events: events[0].map(event => {
                event.payload = JSON.parse(event.payload);
                return event;
            }),
            cursor: events[0]?.length >= filter.limit ? filter.cursor + 1 : null,
            debug: {toExecute, values}
        };
    }

    async close()
    {
        await this.db.end();
        return true;
    }

    async createTable()
    {
        const exists = await this.db.execute(
            'SELECT count(*) FROM information_schema.TABLES WHERE (TABLE_SCHEMA = ?) AND (TABLE_NAME = \'events\')',
            [this.config.database]
        );

        if(exists[0][0]['count(*)'])
        {
            const table = await this.db.execute('DESCRIBE events', []);
            if(!await this.verifySchema(table[0], databaseSchema))
                throw Error('Existing table schema is not valid.');
        }
        else
        {
            await this.db.execute(`CREATE TABLE events (${this.buildFieldListFromSchema(databaseSchema)})`, []);
        }
    }

    async createDatabase()
    {
        const db = await mysql.createConnection({
            host: this.config.host,
            port: this.config.port,
            user: this.config.user,
            password: this.config.password,
        });
        await db.execute(`CREATE DATABASE IF NOT EXISTS ${this.config.database}`, []);
        await db.end();
    }

    verifySchema(data, databaseSchema)
    {
        return new Promise(resolve => {
            let valid = false;
            Object.values(databaseSchema.fields).forEach(field => {
                for(let i = 0; i < data.length; i++)
                {
                    if(data[i].Field === field.Field)
                    {
                        if(
                            data[i].Type === field.Type &&
                            data[i].Null === field.Null &&
                            data[i].Key === field.Key &&
                            data[i].Default === field.Default &&
                            data[i].Extra === field.Extra
                        )
                        {
                            valid = true;
                            break;
                        }

                        valid = false;
                    }
                }

                if(!valid)
                    return resolve(false);
            });
            resolve(true);
        });
    }

    buildFieldListFromSchema(databaseSchema)
    {
        let primaryKey = '';
        const index = [];
        const fields = Object.keys(databaseSchema.fields).map(field => {
            const properties = [];
            properties.push(field);
            properties.push(databaseSchema.fields[field].Type);
            if(databaseSchema.fields[field].Null === 'NO')
                properties.push('not null');

            if(databaseSchema.fields[field].Key === 'PRI')
                primaryKey = field;
            if(databaseSchema.fields[field].Key === 'MUL')
                index.push(field);
            if(databaseSchema.fields[field].Key === 'UNI')
                properties.push('unique');

            if(databaseSchema.fields[field].Default !== null)
                properties.push(`default ${databaseSchema.fields[field].Default}`);

            if(databaseSchema.fields[field].Extra)
                properties.push(databaseSchema.fields[field].Extra);

            return properties.join(' ');
        });

        const queryParts = [];
        queryParts.push(fields.join(','));
        queryParts.push(`, PRIMARY KEY (${primaryKey})`);
        queryParts.push(`, UNIQUE KEY \`${databaseSchema.options.uniqueKey.name}\` (${databaseSchema.options.uniqueKey.fields.join(',')})`);
        index.forEach(field => queryParts.push(`, INDEX USING BTREE (${field})`));
        return queryParts.join(' ');
    }
}

module.exports = Adapter;
