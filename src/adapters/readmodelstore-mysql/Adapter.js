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
    constructor(args, transactionConnection = null)
    {
        super();
        if(args.debugSql)
        {
            this.debugSql = true;
            delete args.debugSql;
        }
        if(!args.database || typeof args.database !== 'string')
        {
            throw new Error('Readmodelstore needs a database name.');
        }
        this.args = {...args};
        this.transactionConnection = transactionConnection;
    }

    printDebugStatemant(sql, parameters)
    {
        if(!this.debugSql)
            return;
        console.log(sql, JSON.stringify(parameters ?? '[NO PARAMS]'), 
            this.transactionConnection ? ['TRANSACTION(',this.transactionConnection.threadId,')'].join('') : ''
        );
    }

    async checkConnection()
    {
        if(!this.transactionConnection && !this.pool)
        {
            await this.connect();
        }
    }

    async connect()
    {
        if(this.transactionConnection)
        {
            throw new Error('Can not be used inside transactions');
        }
        this.pool = await mysql.createPool(this.args);
    }

    async disconnect()
    {
        if(this.transactionConnection)
        {
            throw new Error('Can not be used inside transactions');
        }
        await this.pool.end();
        this.pool = null;
    }

    async exec(sql, parameters)
    {
        await this.checkConnection();
        this.printDebugStatemant(sql, parameters);
        const connection = this.transactionConnection ?? this.pool;
        return connection.execute(sql, parameters);
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

    async checkTable(tableName, hash, transaction)
    {
        const result = await transaction.findOne('information_schema.TABLES', {
            TABLE_SCHEMA: this.args.database,
            TABLE_NAME: tableName,
        },
        {
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
        const transaction = await this.beginTransaction();
        try 
        {
            const checkResult = await this.checkTable(tableName, hash, transaction);

            if(options?.triggerReplay && checkResult === tableCheckTypes.unmanaged)
            {
                throw new Error('Tried replay on unmanaged table. Check TABLE_COMMENT.');
            }
        
            if(options?.triggerReplay && checkResult === tableCheckTypes.schemaChanged)
            {
                await transaction.dropTable(tableName);
            }

            if((options?.triggerReplay && checkResult === tableCheckTypes.schemaChanged) || 
            checkResult === tableCheckTypes.new)
            {
                await transaction.exec(sql);
                await transaction.commit();
                return true;
            }
            await transaction.commit();
        }
        catch(e)
        {
            await transaction.rollback();
            throw e;
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

    async find(tableName, conditions, queryOptions = {}){
        const {sql, parameters} = selectBuilder(tableName, {...queryOptions, conditions});
        return (await this.exec(sql, parameters))?.[0] ?? [];
    }

    async findOne(tableName, conditions, queryOptions = {}){
        const res = await this.find(tableName, conditions, {...queryOptions, limit: 1});
        return res?.[0] ?? null;
    }

    async count(tableName, conditions, queryOptions = {}){
        const res = await this.find(tableName, conditions, {...queryOptions, count: true});
        return res?.[0]?.cnt ?? 0;
    }

    async delete(tableName, conditions){
        const {sql, parameters} = conditionBuilder(conditions);
        return this.getStatementMetaData(
            await this.exec(['DELETE FROM', quoteIdentifier(tableName), 'WHERE', sql].join(' '), parameters)
        );
    }

    async beginTransaction()
    {
        if(this.transactionConnection)
        {
            throw new Error('Transaction already started');
        }
        await this.checkConnection();
        const connection = await this.pool.getConnection();
        await connection.beginTransaction();
        return new Adapter({...this.args, debugSql: this.debugSql}, connection);
    }

    async commit()
    {
        if(!this.transactionConnection)
        {
            throw new Error('Can only be used within a transaction');
        }
        await this.transactionConnection.commit();
        await this.transactionConnection.release();
    }

    async rollback()
    {
        if(!this.transactionConnection)
        {
            throw new Error('Can only be used within a transaction');
        }
        await this.transactionConnection.rollback();
        await this.transactionConnection.release();
    }
}

module.exports = Adapter;
