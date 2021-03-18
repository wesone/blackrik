const mysql = require('mysql2/promise');
const ReadModelStoreAdapterInterface = require('../ReadModelStoreAdapterInterface');
const { conditionBuilder } = require('./ConditionBuilder');
const { quoteIdentifier } = require('./utils');
const { createTableBuilder } = require('./CreateTableBuilder');
const { insertIntoBuilder } = require('./InsertIntoBuilder');
const { updateBuilder } = require('./UpdateBuilder');
const { selectBuilder } = require('./SelectBuilder');

const tableCheckTypes = {
    new: Symbol('new'),
    schemaChanged: Symbol('schemaChanged'),
    unchanged: Symbol('unchanged'),
    unmanaged: Symbol('unmanaged'),
};

class Adapter extends ReadModelStoreAdapterInterface
{
    constructor(args)
    {
        super();
        if(args.debugSql)
        {
            this.debugSql = true;
            delete args.debugSql;
        }
        this.args = {...args};
    }

    printDebugStatemant(sql, parameters)
    {
        if(!this.debugSql)
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

    async disconnect()
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

    getStatementMetaData([results])
    {
        return {
            id: results?.insertId ?? null,
            affected: results?.affectedRows ?? 0,
            changed: results?.changedRows ?? 0,
        };
    }

    validateHash(hash)
    {
        return !!hash && typeof hash === 'string' && hash.length >= 130 && hash.split(':', 3).length === 2;
    }

    async checkTable(tableName, hash)
    {
        const result = await this.findOne('information_schema.TABLES', {
            conditions: {
                TABLE_SCHEMA: this.args.database,
                TABLE_NAME: tableName,
            },
            fields: ['TABLE_NAME', 'TABLE_COMMENT'],
        });

        if(!result)
        {
            return tableCheckTypes.new;
        }

        if(!this.validateHash(result.TABLE_COMMENT))
        {
            return tableCheckTypes.unmanaged;
        }

        if(hash !== result.TABLE_COMMENT)
        {
            return tableCheckTypes.schemaChanged;
        }
            
        return tableCheckTypes.unchanged;
    }

    async defineTable(tableName, fieldDefinitions, options = {triggerReplay: true}){
        const {sql, hash} = createTableBuilder(tableName, fieldDefinitions);
        const checkResult = await this.checkTable(tableName, hash);

        if(options?.triggerReplay && checkResult === tableCheckTypes.unmanaged)
        {
            throw new Error('Tried replay on unmanaged table. Check TABLE_COMMENT.');
        }
        
        if(options?.triggerReplay && checkResult === tableCheckTypes.schemaChanged)
        {
            await this.dropTable(tableName);
        }

        if((options?.triggerReplay && checkResult === tableCheckTypes.schemaChanged) || 
            checkResult === tableCheckTypes.new)
        {
            await this.exec(sql);
            return true;
        }

        return false;
    }

    async dropTable(tableName){
        return await this.exec(['DROP TABLE IF EXISTS', quoteIdentifier(tableName)].join(' '));
    }

    async insert(tableName, data){
        const {sql, parameters} = insertIntoBuilder(tableName, data);
        return this.getStatementMetaData(await this.exec(sql, parameters));
    }

    async update(tableName, conditions, data){
        const {sql, parameters} = updateBuilder(tableName, data, conditions);
        return this.getStatementMetaData(await this.exec(sql, parameters));
    }

    async find(tableName, queryOptions){
        const {sql, parameters} = selectBuilder(tableName, queryOptions);
        return (await this.exec(sql, parameters))?.[0] ?? [];
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
        return this.getStatementMetaData(
            await this.exec(['DELETE FROM', quoteIdentifier(tableName), 'WHERE', sql].join(' '), parameters)
        );
    }
}

module.exports = Adapter;
