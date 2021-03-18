const EventStoreAdapterInterface = require('../EventStoreAdapterInterface');
const mysql = require('mysql2');

class Adapter extends EventStoreAdapterInterface
{
    config;
    db;

    constructor(config)
    {
        console.log('constructor');
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
        await this.createDatabase();
        this.db = mysql.createConnection(this.config);
        await this.db.connect();
        await this.createTable();
        // todo check if scheme is valid

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
        console.log('save');
        await new Promise((resolve, reject) => {
            this.db.execute(`INSERT INTO events (${Object.keys(event).join(',')}) VALUES (${Object.keys(event).map(() => '?').join(',')})`, Object.values(event), (err, res) => {
                if(err)
                    return reject(err);
                resolve(res);
            });
        });
    }

    async load(filter)
    {
        console.log('load');
        // Leider kann man nicht einfach Arrays mit einem Placeholder in execute nutzen,
        // daher etwas umständlicher gelöst https://github.com/sidorares/node-mysql2/issues/476
        const values = filter.aggregateIds.concat(filter.types);
        values.push(filter.since);
        values.push(filter.until);
        values.push(filter.limit);
        const events = await new Promise((resolve, reject) => {
            this.db.execute(`SELECT * FROM events WHERE aggregateId IN (${filter.aggregateIds.map(() => '?').join(',')}) AND type IN (${filter.types.map(() => '?').join(',')}) AND (timestamp >= ? AND timestamp < ?) ORDER BY position ASC LIMIT ?`, values, (err, res) => {
                if(err)
                    return reject(err);
                resolve(res);
            });
        });

        const rows = await new Promise((resolve, reject) => {
            this.db.execute('SELECT FOUND_ROWS() FROM events', values, (err, res) => {
                if(err)
                    return reject(err);
                resolve(res);
            });
        });

        return { events, rows: rows[0]['FOUND_ROWS()'] };
    }

    async createTable()
    {
        console.log('createTable');
        const exists = await new Promise((resolve, reject) => {
            this.db.query(`SELECT count(*) FROM information_schema.TABLES WHERE (TABLE_SCHEMA = '${this.config.database}') AND (TABLE_NAME = 'events')`, (err, res) => {
                if(err)
                    return reject(err);
                resolve(res[0]['count(*)']);
            });
        });

        if(!exists)
        {
            const fields = [
                'id VARCHAR(36) NOT NULL',
                'position BIGINT UNIQUE NOT NULL AUTO_INCREMENT',
                'aggregateId VARCHAR(32) NOT NULL',
                'aggregateVersion INT NOT NULL',
                'type VARCHAR(32) NOT NULL',
                'timestamp BIGINT NOT NULL',
                'correlationId VARCHAR(32) NOT NULL',
                'causationId VARCHAR(32) NOT NULL',
                'payload TEXT NOT NULL',
                'PRIMARY KEY (id)',
                'UNIQUE KEY `streamId` (aggregateId,aggregateVersion)'
            ];
            const query = `CREATE TABLE events (${fields.join(',')})`;
            await new Promise((resolve, reject) => {
                this.db.query(query, (err, res) => {
                    if(err)
                        return reject(err);
                    resolve(res);
                });
            });
        }
    }

    async createDatabase()
    {
        console.log('createDatabase');
        const connection = mysql.createConnection({
            host: this.config.host,
            port: this.config.port,
            user: this.config.user,
            password: this.config.password
        });

        await new Promise((resolve, reject) => {
            connection.query('CREATE DATABASE IF NOT EXISTS eventStore', (err, res) => {
                if(err)
                    return reject(err);
                resolve(res);
            });
        });

        await new Promise((resolve, reject) => {
            connection.end(err => {
                if(err)
                    return reject(err);
                resolve();
            });
        });
    }
}

module.exports = Adapter;
