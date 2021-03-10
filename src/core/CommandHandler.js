const Event = require('./Event');

class CommandHandler 
{
    #blackrik;

    constructor(blackrik)
    {
        this.#blackrik = blackrik;
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
        return Object.prototype.hasOwnProperty.call(this.#blackrik._aggregates, aggregateName);
    }

    buildContext()
    {
        return Object.freeze({
            blackrik: this.#blackrik
        });
    }

    async handle({blackrik, body}, res)
    {
        const command = this.createCommand(body);
        //TODO load aggregateVersion

        const {aggregateName, aggregateId, type} = command;

        if(!this.hasAggregate(aggregateName))
            return res.sendStatus(400).end(); //TODO error for invalid aggregate

        const aggregate = this.#blackrik._aggregates[aggregateName];
        const {commands} = aggregate;

        if(!Object.prototype.hasOwnProperty.call(commands, type))
            return res.sendStatus(400).end(); //TODO error for unknown command
        
        let event = null;
        try
        {
            event = await commands[type](
                command, 
                await aggregate.load(aggregateId), 
                this.buildContext()
            );  
        }
        catch(e)
        {
            return res.status(e.status || 500).send(e.message || e);
        }

        if(!event)
            return;

        event = new Event(event);
        blackrik._eventBus.publish(event);
        res.json(event);
    }
}

module.exports = CommandHandler;
