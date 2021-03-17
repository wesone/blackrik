const Event = require('./Event');
const {BadRequestError} = require('./Errors');

class CommandHandler 
{
    #blackrik;

    constructor(blackrik)
    {
        this.#blackrik = blackrik;
        this.handle = this.handle.bind(this);
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
            blackrik: req.blackrik
        });
    }

    async processEvent(event, aggregateId, causationEvent = null)
    {
        event.aggregateId = aggregateId;
        if(causationEvent)
        {
            const {correlationId, id} = causationEvent;
            event.correlationId = correlationId;
            event.causationId = id;
        }
        event = new Event(event);

        await this.#blackrik._eventHandler.publish(event);
        return event;
    }

    async handle(req)
    {
        return this.process(req.body, this.buildContext(req));
    }

    async process(args, context = {})
    {
        const command = this.createCommand(args);
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
            context
        );
        
        return event
            ? await this.processEvent(event, aggregateId, context.causationEvent)
            : null;
    }
}

module.exports = CommandHandler;
