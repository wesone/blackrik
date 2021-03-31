const mysql = require('mysql2/promise');
const ReadModelStoreAdapterInterface = require('../ReadModelStoreAdapterInterface');
const { conditionBuilder } = require('./ConditionBuilder');
const { quoteIdentifier, convertValue, getPositionCheckCondition } = require('./utils');
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
        if(!args.database || typeof args.database !== 'string')
        {
            throw new Error('Readmodelstore needs a database name.');
        }
        this.args = {...args, timezone: 'Z'}; // All dates are referenced to utc
        this.isTransaction = false;
    }

    printDebugStatemant(sql, parameters)
    {
        if(!this.debugSql)
            return;
        console.log(sql, JSON.stringify(parameters ?? '[NO PARAMS]'), 
            this.isTransaction ? ['TRANSACTION(',this.connection.threadId,')'].join('') : ''
        );
    }

    async checkConnection()
    {
        if(!this.connection)
        {
            await this.connect();
        }
    }

    async connect()
    {
        this.connection = await mysql.createConnection(this.args);
    }

    async disconnect()
    {
        await this.connection.end();
        this.connection = null;
    }

    async exec(sql, parameters)
    {
        await this.checkConnection();
        this.printDebugStatemant(sql, parameters);
        const connection = this.transactionConnection ?? this.connection;
        return connection.execute(sql, parameters);
    }

    getAffectedCount([results])
    {
        return results?.affectedRows ?? 0;
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

        if(scheme._lastPosition)
        {
            throw new Error('_lastPosition is a reserved field name.');
        }

        const schemeWithMetaData = {...scheme, 
            _lastPosition: {
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
        return this.getAffectedCount(await this.exec(sql, parameters));
    }

    async update(tableName, conditions, data, position = null){
        const {sql, parameters} = updateBuilder(tableName, data, conditions, position);
        return this.getAffectedCount(await this.exec(sql, parameters));
    }

    async find(tableName, conditions, queryOptions = {}){
        const {sql, parameters} = selectBuilder(tableName, {...queryOptions, conditions});
        const queries = [
            this.exec(sql, parameters)
        ];
        if(queryOptions.position)
        {
            queries.push(this.findOne(tableName, null, {
                fields: ['_lastPosition'],
                sort: [{_lastPosition: -1}]
            }));
        }

        const results = await Promise.all(queries);

        if(queryOptions.position)
        {
            const maxPosition = results[1]?._lastPosition ?? -1;
            if(maxPosition < queryOptions.position)
            {
                const error =  new Error('Data not yet availible');
                error.code = 409;
                throw error;
            }
        }
        
        return results?.[0]?.[0] ?? [];
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
        let {sql, parameters} = conditionBuilder(conditions);
        let affectedCount;
        if(position !== null)
        {
            const checkCondition = getPositionCheckCondition(tableName, position);
            sql += [' AND', checkCondition[0]].join(' ');
            parameters.push(convertValue(checkCondition[1]));
            await this.beginTransaction();
        }
        try 
        {
            affectedCount = this.getAffectedCount(
                await this.exec(['DELETE FROM', quoteIdentifier(tableName), 'WHERE', sql].join(' '), parameters)
            );
            if(affectedCount > 0 && position)
            {
                await this.exec(['UPDATE', quoteIdentifier(tableName), 'SET', quoteIdentifier('_lastPosition'), '=', '?', 
                    'ORDER BY', quoteIdentifier('_lastPosition'), 'DESC', 'LIMIT', '?'].join(' '), 
                [convertValue(position), convertValue(1)]);
            }
            if(position !== null)
                await this.commit();
        }
        catch(e)
        {
            console.log('Error', e);
            if(position !== null)
                await this.rollback();
            throw e;
        }
        
        return affectedCount;
    }

    async beginTransaction()
    {
        if(this.isTransaction)
        {
            throw new Error('Transaction already started');
        }
        await this.connection.beginTransaction();
        this.isTransaction = true;
    }

    async commit()
    {
        if(!this.isTransaction)
        {
            throw new Error('Can only be used in a transaction');
        }
        await this.connection.commit();
        this.isTransaction = false;
    }

    async rollback()
    {
        if(!this.isTransaction)
        {
            throw new Error('Can only be used in a transaction');
        }
        await this.connection.rollback();
        this.isTransaction = false;
    }
}

module.exports = Adapter;
