const Aggregates = require('./Aggregates');

class CommandHandler 
{
    #blackrik;

    constructor(blackrik)
    {
        this.#blackrik = blackrik;
        //TODO if a projection contains events, subscribe and execute projections accordingly
        return this.handle.bind(this);
    }

    createCommand(command)
    {
        const {aggregateName, aggregateId, type, payload} = command;
        //TODO validate
        return {
            aggregateName,
            aggregateId,
            type,
            timestamp: Date.now(),
            payload
        };
    }

    hasAggregate(aggregateName)
    {
        return Object.prototype.hasOwnProperty.call(this.#aggregates, aggregateName);
    }

    async handle({blackrik, body}, res)
    {
        const command = this.createCommand(body);
        //TODO load aggregateVersion

        const {aggregateName, aggregateId, type} = command;

        if(!this.hasAggregate(aggregateName))
            return res.sendStatus(400).end(); //TODO error for invalid aggregate

        const {commands, projection} = this.#aggregates[aggregateName];

        if(!Object.prototype.hasOwnProperty.call(commands, type))
            return res.sendStatus(400).end(); //TODO error for unknown command
        
        const state = Aggregates.load(aggregateId); //TODO load aggregate from state if aggregate does not exist use default state from projection
        const context = Object.freeze({
            blackrik
        });
        let event = null;

        try
        {
            event = await commands[type](command, state, context);  
        }
        catch(e)
        {
            res.status(e.status || 500).send(e.message || e);
        }

        if(event)
            blackrik._eventBus.publish(event);
        res.json(event);
    }
}

module.exports = CommandHandler;
