const EventBusAdapterInterface = require('../EventBusAdapterInterface');

const EventEmitter = require('events');

class Adapter extends EventBusAdapterInterface
{
    #eventBus;

    async init()
    {
        this.#eventBus = new EventEmitter();
    }

    async start()
    {
        return true;
    }

    async subscribe(name, type, callback)
    {
        if(typeof name !== 'string')
            throw Error(`First parameter of subscribe needs to be of type string (given type: ${typeof type}).`);
        if(typeof type !== 'string')
            throw Error(`Second parameter of subscribe needs to be of type string (given type: ${typeof type}).`);
        if(typeof callback !== 'function')
            throw Error(`Third parameter of subscribe needs to be of type function (given type: ${typeof callback}).`);

        this.#eventBus.on(type, callback);
        return true;
    }

    async publish(name, event)
    {
        if(Array.isArray(event))
        {
            event.forEach(evt => this.#eventBus.emit(evt.type, evt));
            return true;
        }
        this.#eventBus.emit(event.type, event);
        return true;
    }    
}

module.exports = Adapter;
