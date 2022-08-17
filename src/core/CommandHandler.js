const Event = require('./Event');
const {BadRequestError} = require('./Errors');
const { TOMBSTONE_EVENT_TYPE } = require('./Constants');

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

    async executeHandler(handler, command, state, context)
    {
        const {type = null, payload = null} = await handler(
            command, 
            state, 
            context
        ) ?? {};
        
        if(!type)
            return null;

        return {
            type,
            payload
        };
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
        context.aggregateVersion = latestEvent?.aggregateVersion ?? 0;
        context.latestEventPosition = latestEvent?.position ?? null;
        
        const event = await this.executeHandler(
            commands[type], 
            command, 
            state, 
            Object.freeze(context)
        );
        
        if(!event)
            return null;

        event.aggregateId = aggregateId;
        event.aggregateVersion = context.aggregateVersion + 1;
        return await this.#blackrik._eventHandler.publish(aggregateName, new Event(event, context.causationEvent));
    }

    async deleteAggregate(aggregateName, aggregateId, payload = null, causationEvent = null)
    {
        if(!this.hasAggregate(aggregateName))
            throw new BadRequestError('Invalid aggregate');
        const aggregate = this.#blackrik._aggregates[aggregateName];
        const latestEvent = await aggregate.loadLatestEvent(this.#blackrik._eventStore, aggregateId);
        if(!latestEvent)
            return;

        await this.#blackrik._eventHandler.publish(
            aggregateName, 
            new Event(
                {
                    aggregateId,
                    aggregateVersion: latestEvent.aggregateVersion + 1,
                    type: TOMBSTONE_EVENT_TYPE,
                    payload
                }, 
                causationEvent
            )
        );
    }
}

module.exports = CommandHandler;
