const Aggregate = require('../../src/core/Aggregate');

describe('isValid', () => {
    test('Valid if aggregate has property \'name\'', () => {
        expect(() => Aggregate.isValid({name: 'Test'})).not.toThrow();
        expect(() => Aggregate.isValid({
            name: 'Test',
            commands: {},
            projection: {}
        })).not.toThrow();
    });
    test('Throws for invalid objects', () => {
        expect(() => Aggregate.isValid({})).toThrow();
        expect(() => Aggregate.isValid({
            commands: {},
            projection: {}
        })).toThrow();
    });
});

describe('fromArray', () => {
    test('Transforms array to object', () => {
        const aggregates = [
            {name: 'one'},
            {name: 'two'},
            {name: 'three'}
        ];

        expect(Aggregate.fromArray(aggregates)).toStrictEqual(Object.fromEntries(aggregates.map(({name}) => [name, new Aggregate({name})])));
    });
    test('Prevents name duplicates', () => {
        const aggregates = [
            {name: 'one'},
            {name: 'two'},
            {name: 'one'}
        ];

        expect(() => Aggregate.fromArray(aggregates)).toThrow();
    });
});

test('hasProjection', () => {
    const eventType = 'USER_CREATED';
    const aggregate = new Aggregate({
        name: 'Test',
        projection: {
            init: ({}),
            [eventType]: jest.fn()
        }
    });

    expect(aggregate.hasProjection(eventType)).toBe(true);
    expect(aggregate.hasProjection('invalid_type')).toBe(false);
});

describe('_reduceEvents', () => {
    test('Test correct reduction of event list', async () => {
        const projection = { 
            init: 'This is no function',
            'USER_CREATED': (state, {payload}) => ({
                ...state,
                ...payload,
                registered: true
            }),
            'USER_NAME_CHANGED': (state, {payload}) => ({
                ...state,
                ...payload
            })
        };
        const events = [
            {
                type: 'USER_CREATED',
                payload: {
                    name: 'Test'
                }
            },
            {
                type: 'USER_NAME_CHANGED',
                payload: {
                    name: 'Test 2'
                }
            },
            {
                type: 'USER_RANDOM_EVENT',
                payload: 42
            }
        ];
        const aggregate = new Aggregate({name: 'Test', projection});

        await expect(aggregate._reduceEvents(events)).resolves.toStrictEqual({
            name: 'Test 2',
            registered: true
        });
    });
});

describe('loadLatestEvent', () => {
    const aggregateId = '42';
    let events;
    let eventStoreMock;
    beforeEach(() => {
        events = [
            {
                type: 'USER_CREATED',
                payload: {
                    name: 'Test'
                }
            },
            {
                type: 'USER_NAME_CHANGED',
                payload: {
                    name: 'Test 2'
                }
            },
            {
                type: 'USER_RANDOM_EVENT',
                payload: 42
            }
        ];
        eventStoreMock = {
            load: jest.fn(filter => {
                const copy = JSON.parse(JSON.stringify(events));
                if(filter.reverse === true)
                    copy.reverse();
                if(!isNaN(filter.limit) && filter.limit !== null)
                    copy.splice(filter.limit, copy.length - filter.limit);
                return {
                    events: copy,
                    cursor: null
                };
            })
        };
    });

    test('Returns latest event', async () => {
        const aggregate = new Aggregate({name: 'Test', projection: {}});

        await expect(aggregate.loadLatestEvent(eventStoreMock, aggregateId)).resolves.toStrictEqual(events.pop());
    });
    test('Returns null if there are no events', async () => {
        events.splice(0, events.length);
        const aggregate = new Aggregate({name: 'Test', projection: {}});

        await expect(aggregate.loadLatestEvent(eventStoreMock, aggregateId)).resolves.toBeNull();
    });
});

describe('load', () => {
    const aggregateId = '42';
    const events = [
        {
            aggregateId,
            type: 'USER_CREATED',
            payload: {
                name: 'Test'
            }
        },
        {
            aggregateId,
            type: 'USER_NAME_CHANGED',
            payload: {
                name: 'Test 2'
            }
        },
        {
            aggregateId,
            type: 'USER_RANDOM_EVENT',
            payload: 42
        }
    ];
    let eventStoreMock;
    beforeEach(() => {
        eventStoreMock = {
            load: jest.fn(() => {
                return {
                    events: JSON.parse(JSON.stringify(events)),
                    cursor: null
                };
            })
        };
    });

    test('Build state and latestEvent', async () => {
        const projection = { 
            init: jest.fn(() => ({initialized: true})),
            'USER_CREATED': (state, {payload}) => ({
                ...state,
                ...payload,
                registered: true
            }),
            'USER_NAME_CHANGED': (state, {payload}) => ({
                ...state,
                ...payload
            })
        };
        const aggregate = new Aggregate({name: 'Test', projection});

        await expect(aggregate.load(eventStoreMock, aggregateId)).resolves.toStrictEqual({
            state: {
                initialized: true,
                name: 'Test 2',
                registered: true
            },
            latestEvent: events[2]
        });
        expect(projection.init).toHaveBeenCalled();
    });
    test('Empty object as initial state if \'init\' is not a function', async () => {
        const projection = {
            init: 'This is not a function'
        };
        const aggregate = new Aggregate({name: 'Test', projection});
        
        await expect(aggregate.load(eventStoreMock, aggregateId)).resolves.toStrictEqual({
            state: {},
            latestEvent: events[2]
        });
    });

    test('Expect null for latestEvent if there are no events', async () => {
        const projection = {
            init: 'This is not a function'
        };
        const aggregate = new Aggregate({name: 'Test', projection});
        eventStoreMock = {
            load: jest.fn(() => {
                return {
                    events: [],
                    cursor: null
                };
            })
        };

        await expect(aggregate.load(eventStoreMock, aggregateId)).resolves.toStrictEqual({
            state: {},
            latestEvent: null
        });
    });
});
