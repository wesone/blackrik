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

    buildContext(req)
    {
        return Object.freeze({
            //TODO add context from middlewares (req.context)
            blackrik: req.blackrik
        });
    }

    processEvent(aggregateId, event)
    {
        event.aggregateId = aggregateId;
        event = new Event(event);
        this.#blackrik._eventBus.publish(event);
        return event;
    }

    async handle(req, res)
    {
        const {body} = req;

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
                this.buildContext(req)
            );  
        }
        catch(e)
        {
            return res.status(e.status || 500).send(e.message || e);
        }

        if(!event)
            return res.sendStatus(200).end();

        event = this.processEvent(aggregateId, event);
        res.json(event);
    }
}

module.exports = CommandHandler;
