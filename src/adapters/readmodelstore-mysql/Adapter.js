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
        this.args = {...args, timezone: 'Z'}; // All dates are referenced to utc
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

    async checkTable(tableName, hash)
    {
        const result = await this.findOne('information_schema.TABLES', {
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

    async defineTable(tableName, scheme/*, options = {triggerReplay: true}*/){
        const options = {triggerReplay: true};

        if(scheme.lastPosition)
        {
            throw new Error('lastPosition is a reserved field name.');
        }

        const schemeWithMetaData = {...scheme, 
            lastPosition: {
                type: 'Number',
                unique: true
            }
        };

        const {sql, hash} = createTableBuilder(tableName, schemeWithMetaData);
        
        const checkResult = await this.checkTable(tableName, hash);

        if(options?.triggerReplay && checkResult === tableCheckTypes.unmanaged)
        {
            throw new Error('Tried replay on unmanaged table. Check TABLE_COMMENT.');
        }
        
        if(options?.triggerReplay && checkResult === tableCheckTypes.schemaChanged)
        {
            try
            {
                await this.exec(createTableBuilder(tableName + '_new', schemeWithMetaData)['sql']);
                await this.exec(['RENAME TABLE', quoteIdentifier(tableName), 'TO', quoteIdentifier(tableName + '_old'),',',
                    quoteIdentifier(tableName + '_new'), 'TO', quoteIdentifier(tableName)].join(' '));
                await this.dropTable(tableName + '_old');
                return true; // trigger replay
            } 
            catch(e)
            {
                if(e?.errno === 1050) // Table already exists
                {
                    // Table recreation already in progress. Do nothing.
                    return false;
                }
                throw e;
            }
        } 
        else if(checkResult === tableCheckTypes.new)
        {
            await this.exec(sql);
            return true; // trigger replay
        }
        return false; // Do nothing
    }

    async dropTable(tableName){
        return await this.exec(['DROP TABLE IF EXISTS', quoteIdentifier(tableName)].join(' '));
    }

    async insert(tableName, data, position = null){
        const {sql, parameters} = insertIntoBuilder(tableName, data, position);
        return this.getStatementMetaData(await this.exec(sql, parameters));
    }

    async update(tableName, conditions, data, position = null){
        // TODO: position check
        const {sql, parameters} = updateBuilder(tableName, data, conditions);
        return this.getStatementMetaData(await this.exec(sql, parameters));
    }

    async find(tableName, conditions, queryOptions = {}){
        if(queryOptions.position)
        {
            const maxPosition = (await this.findOne(tableName, null, {
                fields: ['lastPosition'],
                sort: [{lastPosition: -1}]
            }))?.lastPosition ?? -1;
            if(maxPosition < queryOptions.position)
            {
                const error =  new Error('Data not yet availible');
                error.code = 409;
                throw error;
            }
        }
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

    async delete(tableName, conditions, position = null){
        // TODO: position check
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
