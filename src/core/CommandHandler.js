const Event = require('./Event');
const {BadRequestError} = require('./Errors');

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

    async handle(req)
    {
        const {body} = req;

        const command = this.createCommand(body);
        //TODO load aggregateVersion

        const {aggregateName, aggregateId, type} = command;

        if(!this.hasAggregate(aggregateName))
            throw new BadRequestError('Invalid aggregate');

        const aggregate = this.#blackrik._aggregates[aggregateName];
        const {commands} = aggregate;

        if(!Object.prototype.hasOwnProperty.call(commands, type))
            throw new BadRequestError('Unknown command');
        
        const event = await commands[type](
            command, 
            await aggregate.load(this.#blackrik._eventStore, aggregateId), 
            this.buildContext(req)
        );  
        
        return event
            ? this.processEvent(aggregateId, event)
            : null;
    }
}

module.exports = CommandHandler;
