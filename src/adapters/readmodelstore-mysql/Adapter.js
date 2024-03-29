const mysql = require('mysql2/promise');
const ReadModelStoreAdapterInterface = require('../ReadModelStoreAdapterInterface');
const {conditionBuilder} = require('./ConditionBuilder');
const {quoteIdentifier, convertValue, convertBinaryRows, getPositionCheckCondition} = require('./utils');
const {createTableBuilder} = require('./CreateTableBuilder');
const {insertIntoBuilder} = require('./InsertIntoBuilder');
const {updateBuilder} = require('./UpdateBuilder');
const {selectBuilder} = require('./SelectBuilder');

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
        if(args.useDatabase)
        {
            this.useDatabase = args.useDatabase;
            delete args.useDatabase;
        }
        if(!this.useDatabase && (!args.database || typeof args.database !== 'string'))
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

    errorHandler(err, shouldThrow = true){
        if(err.fatal)
        {
            this.connection = null;
            this._conn = null;
        }
        if(shouldThrow) 
            throw err;
        else 
            console.error(err);
    }

    async checkConnection()
    {
        if(!this.connection)
        {
            if(this._conn)
                await this._conn;
            else
            {
                await this.connect();
                await this.useDB();
            }
        }
    }

    async connect()
    {
        this._conn = mysql.createConnection(this.args).then(conn => {
            this._conn = null;
            return conn;
        });
        this.connection = await this._conn;
        this.connection.on('error', err => {
            this.errorHandler(err, false);
        });
    }

    async disconnect()
    {
        if(this.connection)
        {
            await this.connection.end();
            this.connection = null;
            this._conn = null;
        }
    }
        
    async useDB()
    {
        if(!this.useDatabase)
        {
            return;
        }
        await this.exec(`CREATE DATABASE IF NOT EXISTS ${quoteIdentifier(this.useDatabase)}`, []);
        await this.connection.query(`USE ${quoteIdentifier(this.useDatabase)}`);
        this.args.database = this.useDatabase;
        delete this.useDatabase;
    }

    async exec(sql, parameters)
    {
        try 
        {
            await this.checkConnection();
            this.printDebugStatemant(sql, parameters);
            return this.connection.execute(sql, parameters);
        } 
        catch(err)
        {
            this.errorHandler(err);
        }
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
            TABLE_SCHEMA: this.useDatabase ?? this.args.database,
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

    async defineTable(tableName, scheme, indexes = []){
        const options = {triggerReplay: true};

        if(scheme._lastPosition)
        {
            throw new Error('_lastPosition is a reserved field name.');
        }

        if(scheme._operation)
        {
            throw new Error('_operation is a reserved field name.');
        }

        const schemeWithMetaData = {...scheme, 
            _lastPosition: 'number',
            _operation: 'number',
        };
        indexes.push({fields: ['_lastPosition', '_operation'], unique: true});

        const {sql, hash} = createTableBuilder(tableName, schemeWithMetaData, indexes);
        
        const checkResult = await this.checkTable(tableName, hash);

        if(options?.triggerReplay && checkResult === tableCheckTypes.unmanaged)
        {
            throw new Error('Tried replay on unmanaged table. Check TABLE_COMMENT.');
        }
        
        if(options?.triggerReplay && checkResult === tableCheckTypes.schemaChanged)
        {
            try
            {
                await this.exec(createTableBuilder(tableName + '_new', schemeWithMetaData, indexes)['sql']);
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

    async insert(tableName, data, meta = null){
        const {sql, parameters} = insertIntoBuilder(tableName, data, meta);
        return !!this.getAffectedCount(await this.exec(sql, parameters));
    }

    async update(tableName, conditions, data, meta = null){
        const {sql, parameters} = updateBuilder(tableName, data, conditions, meta);
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
            const maxPosition = results[1]?._lastPosition ?? Number.MAX_SAFE_INTEGER;
            if(maxPosition < queryOptions.position)
            {
                const error = new Error('Data not yet availible');
                error.status = 409;
                throw error;
            }
        }
        
        return convertBinaryRows(results?.[0]?.[0]) ?? [];
    }

    async findOne(tableName, conditions, queryOptions = {}){
        const res = await this.find(tableName, conditions, {...queryOptions, limit: 1});
        return res?.[0] ?? null;
    }

    async count(tableName, conditions, queryOptions = {}){
        const res = await this.find(tableName, conditions, {...queryOptions, count: true});
        return res?.[0]?.cnt ?? 0;
    }

    async delete(tableName, conditions, meta = null){
        let {sql, parameters} = conditionBuilder(conditions);
        let affectedCount;
        if(meta !== null)
        {
            const checkCondition = getPositionCheckCondition(tableName, meta);
            sql += [' AND', checkCondition[0]].join(' ');
            parameters.push(...checkCondition[1].map(p => convertValue(p)));
            await this.beginTransaction();
        }
        try 
        {
            affectedCount = this.getAffectedCount(
                await this.exec(['DELETE FROM', quoteIdentifier(tableName), 'WHERE', sql].join(' '), parameters)
            );
            if(affectedCount > 0 && meta)
            {
                await this.exec(['UPDATE', quoteIdentifier(tableName), 'SET', quoteIdentifier('_lastPosition'), '=', '?',
                    ',',quoteIdentifier('_operation'), '=', '?',
                    'ORDER BY', quoteIdentifier('_lastPosition'), ',', quoteIdentifier('_operation'), 'DESC', 'LIMIT', '?'].join(' '), 
                [convertValue(meta.position),convertValue(meta.operation), convertValue(1)]);
            }
            if(meta !== null)
                await this.commit();
        }
        catch(e)
        {
            console.log('Error', e);
            if(meta !== null)
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

    async close()
    {
        await this.disconnect();
    }
}

module.exports = Adapter;
