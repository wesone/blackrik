const Event = require('./Event');
const {BadRequestError, ConflictError} = require('./Errors');

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
        return {
            blackrik: req.blackrik
        };
    }

    async processEvent(event, causationEvent = null)
    {
        if(causationEvent)
        {
            const {correlationId, id} = causationEvent;
            event.correlationId = correlationId;
            event.causationId = id;
        }
        event = new Event(event);

        const success = await this.#blackrik._eventHandler.publish(event);
        if(!success)
            throw new ConflictError('Events overlapped');
        return event;
    }

    async handle(req)
    {
        return this.process(req.body, this.buildContext(req));
    }

    async process(args, context = {})
    {
        const command = this.createCommand(args);
        const {aggregateName, aggregateId, type} = command;

        if(!this.hasAggregate(aggregateName))
            throw new BadRequestError('Invalid aggregate');

        const aggregate = this.#blackrik._aggregates[aggregateName];
        const {commands} = aggregate;

        if(!Object.prototype.hasOwnProperty.call(commands, type))
            throw new BadRequestError('Unknown type');

        const {state, latestEvent} = await aggregate.load(this.#blackrik._eventStore, aggregateId);
        context.aggregateVersion = latestEvent
            ? latestEvent.aggregateVersion
            : 0;
        
        const event = await commands[type](
            command, 
            state, 
            Object.freeze(context)
        );
        
        if(!event)
            return null;

        event.aggregateId = aggregateId;
        event.aggregateVersion = context.aggregateVersion + 1;
        return await this.processEvent(event, context.causationEvent);
    }
}

module.exports = CommandHandler;
