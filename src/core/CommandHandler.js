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
        const {aggregateName, aggregateId, type, payload = null} = command;
        if(!aggregateName)
            throw new BadRequestError('Invalid aggregate');
        if(!aggregateId)
            throw new BadRequestError('Invalid aggregateId');
        if(!type)
            throw new BadRequestError('Invalid type');

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

    async processEvent(aggregateName, event, causationEvent = null)
    {
        if(causationEvent)
        {
            const {correlationId, id} = causationEvent;
            event.correlationId = correlationId;
            event.causationId = id;
        }
        return await this.#blackrik._eventHandler.publish(aggregateName, new Event(event)); 
    }

    async handle(req)
    {
        const args = req.params
            ? {
                ...req.body,
                ...req.params
            }
            : req.body;
        return this.process(args, this.#blackrik.buildContext(req));
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
        return await this.processEvent(aggregateName, event, context.causationEvent);
    }
}

module.exports = CommandHandler;
