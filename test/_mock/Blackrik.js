class Blackrik
{
    eventShouldOverlap = false;

    _aggregates = {
        testAggregate: {
            commands: {
                command: (/* command, state, context */) => {},
                commandWithEvent: (/* command, state, context */) => this.exampleEvent
            },
            loadLatestEvent: jest.fn((/* eventStore, aggregateId */) => ({aggregateVersion: 1})),
            load: jest.fn((/* eventStore, aggregateId */) => (
                {
                    state: {},
                    latestEvent: {aggregateVersion: 1}
                }
            ))
        }
    };

    _resolvers = {
        testReadModel: {
            handlers: {
                testResolver: jest.fn(() => {})
            },
            adapter: 'default'
        }
    };
    
    _stores = {
        default: {test: 21}
    };

    _eventHandler = {
        publish: jest.fn((aggregateName, {causationId}) => {
            if(this.eventShouldOverlap)
                throw Error('Overlap');
            return causationId
                ? {...this.exampleEvent, causationId}
                : this.exampleEvent;
        })
    };

    _eventStore = {};

    constructor(exampleEvent = {})
    {
        this.exampleEvent = exampleEvent;
    }

    buildContext(req = null)
    {
        return {
            value: req ? 42 : 21
        };
    }
}

module.exports = Blackrik;
