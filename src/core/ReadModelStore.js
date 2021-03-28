const CONSTANTS = require('./Constants');

class ReadModelStore
{
    #replayEvents = false;
    #affectedTables = [];

    #store;
    #handlers;

    config;

    constructor(store, handlers)
    {
        this.#store = store;
        this.#handlers = handlers;
    }

    _createInitProxy()
    {
        const self = this;
        return new Proxy(this.#store, {
            get: (target, prop, ...rest) => {
                if(prop === 'defineTable')
                    return async function(table, ...args){
                        const created = await target[prop](table, ...args);
                        if(created)
                        {
                            // mark read model events for replay
                            self.#replayEvents = true;
                            // preserve the affected table name of the adapter
                            self.#affectedTables.push(table);
                        }
                        return created;
                    };
                return Reflect.get(target, prop, ...rest);
            }
        });
    }

    async init()
    {
        this.config = typeof this.#handlers[CONSTANTS.READMODEL_INIT_FUNCTION] === 'function'
            ? await this.#handlers[CONSTANTS.READMODEL_INIT_FUNCTION](this._createInitProxy()) || {}
            : {};
        return this.#replayEvents;
    }

    _wrapReadModelStoreFunction(originalHandler, defaultReturn)
    {
        const self = this;
        return async function(table, ...args){
            return self.#affectedTables.includes(table)
                ? await originalHandler(table, ...args)
                : defaultReturn;
        };
    }

    createProxy(event)
    {
        const self = this;
        const proxy = new Proxy(this.#store, {
            get: (target, prop, ...rest) => {
                // if(prop === 'insert')
                //     return async function(table, data){
                //         return await target[prop](table, data, event.position);
                //     };
                // if(prop === 'update')
                //     return async function(table, conditions, data){
                //         return await target[prop](table, conditions, data, event.position);
                //     };
                // if(prop === 'delete')
                //     return async function(table, conditions){
                //         return await target[prop](table, conditions, event.position);
                //     };

                let originalValue = Reflect.get(target, prop, ...rest);
                if(typeof originalValue === 'function')
                    originalValue = originalValue.bind(proxy);
                if(event.isReplay)
                {
                    if(prop === 'insert')
                        return self._wrapReadModelStoreFunction(originalValue, false);
                    if(prop === 'update')
                        return self._wrapReadModelStoreFunction(originalValue, 0);
                    if(prop === 'delete')
                        return self._wrapReadModelStoreFunction(originalValue, 0);
                }
                return originalValue;
            }
        });
        return proxy;
    }
}

module.exports = ReadModelStore;
