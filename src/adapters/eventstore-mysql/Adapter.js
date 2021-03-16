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
    }

    async save(event)
    {
        console.log('save');
        const timestampToString = timestamp => (new Date(timestamp)).toISOString().replace(/T/, ' ').replace(/\..+/, '');
        event.timestamp = timestampToString(event.timestamp);
        await new Promise((resolve, reject) => {
            this.db.execute(`INSERT INTO events (${Object.keys(event).join(',')}) VALUES (?,?,?,?,?,?)`, Object.values(event), (err, res) => {
                if(err)
                    return reject(err);
                resolve(res);
            });
        });
    }

    async load()
    {
        // TODO aggregateIds: Array,
        //      types: Array,
        //      since: Number,
        //      until: Number,
        //      limit: Number

        console.log('load');
        await new Promise((resolve, reject) => {
            this.db.query('SELECT * FROM events WHERE ', (err, res) => {
                if(err)
                    return reject(err);
                resolve(res);
            });
        });
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
                'id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY',
                'aggregateId VARCHAR(32) NOT NULL',
                'type VARCHAR(32) NOT NULL',
                'timestamp TIMESTAMP NOT NULL',
                'correlationId VARCHAR(32) NOT NULL',
                'causationId VARCHAR(32) NOT NULL',
                'payload TEXT NOT NULL',
            ];
            const query = `CREATE TABLE events (${fields.join(', ')})`;
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
