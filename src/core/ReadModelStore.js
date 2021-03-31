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
                const originalValue = Reflect.get(target, prop, ...rest);
                const handler = typeof originalValue === 'function'
                    ? function(...args){
                        return originalValue.bind(proxy)(...args, event.position);
                    }
                    : originalValue;
                if(event.isReplay)
                {
                    if(prop === 'insert')
                        return self._wrapReadModelStoreFunction(handler, false);
                    if(prop === 'update')
                        return self._wrapReadModelStoreFunction(handler, 0);
                    if(prop === 'delete')
                        return self._wrapReadModelStoreFunction(handler, 0);
                }
                return handler;
            }
        });
        return proxy;
    }
}

module.exports = ReadModelStore;
