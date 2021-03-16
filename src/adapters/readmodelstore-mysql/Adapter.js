const mysql = require('mysql2/promise');
const ReadModelStoreAdapterInterface = require('../ReadModelStoreAdapterInterface');
const { conditionBuilder } = require('./ConditionBuilder');
const { quoteIdentifier } = require('./utils');
const { createTableBuilder } = require('./CreateTableBuilder');
const { insertIntoBuilder } = require('./InsertIntoBuilder');
const { updateBuilder } = require('./UpdateBuilder');
const { selectBuilder } = require('./SelectBuilder');

class Adapter extends ReadModelStoreAdapterInterface
{
    constructor(args)
    {
        super();
        this.args = {...args};
    }

    printDebugStatemant(sql, parameters)
    {
        if(!this.args.debugSql)
            return;
        console.log(sql, JSON.stringify(parameters ?? '[NO PARAMS]'));
    }

    async checkConnection()
    {
        if(!this.pool)
        {
            await this.connect();
        }
    }

    async connect()
    {
        this.pool = await mysql.createPool(this.args);
    }

    async diconnect()
    {
        await this.pool.end();
        this.pool = null;
    }

    async exec(sql, parameters)
    {
        await this.checkConnection();
        this.printDebugStatemant(sql, parameters);
        return this.pool.execute(sql, parameters);
    }

    async query(sql, parameters)
    {
        await this.checkConnection();
        this.printDebugStatemant(sql, parameters);
        return this.pool.query(sql, parameters);
    }

    async createTable(tableName, fieldDefinitions){
        const sql = createTableBuilder(tableName, fieldDefinitions);
        return await this.exec(sql);
    }

    async dropTable(tableName){
        return await this.exec(['DROP TABLE IF EXISTS', quoteIdentifier(tableName)].join(' '));
    }

    async insert(tableName, data){
        const {sql, parameters} = insertIntoBuilder(tableName, data);
        return await this.exec(sql, parameters);
    }

    async update(tableName, conditions, data){
        const {sql, parameters} = updateBuilder(tableName, data, conditions);
        return await this.exec(sql, parameters);
    }

    async find(tableName, queryOptions){
        const {sql, parameters} = selectBuilder(tableName, queryOptions);
        return (await this.query(sql, parameters))[0];
    }

    async findOne(tableName, queryOptions){
        const res = await this.find(tableName, {...queryOptions, limit: 1});
        return res?.[0] ?? null;
    }

    async count(tableName, queryOptions){
        const res = await this.find(tableName, {...queryOptions, count: true});
        return res?.[0]?.cnt ?? 0;
    }

    async delete(tableName, conditions){
        const {sql, parameters} = conditionBuilder(conditions);
        return await this.exec(['DELETE FROM', quoteIdentifier(tableName), 'WHERE', sql].join(' '), parameters);
    }
}

module.exports = Adapter;
