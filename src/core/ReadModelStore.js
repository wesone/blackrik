const {READMODEL_INIT_FUNCTION} = require('./Constants');

class ReadModelStore
{
    #replayEvents = false;
    #affectedTables = [];

    #store;
    #handlers;

    config;

    // name of the function and its default return value
    #stateChangingFunctions = {
        insert: false,
        update: 0,
        delete: 0
    };
    #criticalProps;

    constructor(store, handlers)
    {
        this.#store = store;
        this.#handlers = handlers;

        this.#criticalProps = Object.keys(this.#stateChangingFunctions);
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
        this.config = typeof this.#handlers[READMODEL_INIT_FUNCTION] === 'function'
            ? await this.#handlers[READMODEL_INIT_FUNCTION](this._createInitProxy()) || {}
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
        let operation = 0;

        const self = this;
        const proxy = new Proxy(this.#store, {
            get: (target, prop, ...rest) => {
                const originalValue = Reflect.get(target, prop, ...rest);
                const handler = typeof originalValue === 'function'
                    ? self.#criticalProps.includes(prop)
                        ? function(...args){
                            operation++;
                            return originalValue.bind(proxy)(...args, {
                                position: event.position,
                                operation
                            });
                        }
                        : function(...args){
                            return originalValue.bind(proxy)(...args, {
                                position: event.position,
                                operation
                            });
                        }
                    : originalValue;
                if(event.isReplay && self.#criticalProps.includes(prop))
                    return self._wrapReadModelStoreFunction(handler, self.#stateChangingFunctions[prop]);
                return handler;
            }
        });
        return proxy;
    }
}

module.exports = ReadModelStore;
