const EventBusAdapterInterface = require('../EventBusAdapterInterface');

const EventEmitter = require('events');

class Adapter extends EventBusAdapterInterface
{
    async init()
    {
        this.eventBus = new EventEmitter();
    }

    async start()
    {
        return true;
    }

    async subscribe(type, callback)
    {
        if(typeof type !== 'string')
            throw Error(`First parameter of subscribe needs to be of type string (given type: ${typeof type}).`);
        if(typeof callback !== 'function')
            throw Error(`Second parameter of subscribe needs to be of type function (given type: ${typeof callback}).`);
        this.eventBus.on(type, callback);
        return true;
    }

    async publish(event)
    {
        this.eventBus.emit(event.type, event);
        return true;
    }
        
}

module.exports = Adapter;
