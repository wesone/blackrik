const Aggregate = require('../../src/core/Aggregate');
const testEvents = [
    {
        type: 'USER_UPDATED',
        payload: {
            name: '1'
        }
    },
    {
        type: 'USER_UPDATED',
        payload: {
            name: '2'
        }
    },
    {
        type: 'USER_UPDATED',
        payload: {
            name: '3'
        }
    },
    {
        type: 'USER_UPDATED',
        payload: {
            name: '42'
        }
    }
];

describe('Testing fromArray', () => {
    test('Create Aggregate from array', () => {
        const toTest = [{name: 'a'}, {name: 'b'}, {name: 'c'}, {name: 'd'}];
        const expected = {'a': {'commands': undefined, 'name': 'a', 'projection': undefined}, 
            'b': {'commands': undefined, 'name': 'b', 'projection': undefined}, 
            'c': {'commands': undefined, 'name': 'c', 'projection': undefined}, 
            'd': {'commands': undefined, 'name': 'd', 'projection': undefined}};
        expect(Aggregate.fromArray(toTest)).toEqual(expected);
    });
    test('Only create aggregates with different names', () => {
        const toTest = [{name: 'a'}, {name: 'a'}, {name: 'c'}, {name: 'd'}];
        expect(() => Aggregate.fromArray(toTest)).toThrow();
    });
    test('Only create aggregates with existing name (EMPTY OBJECT)' , () => {
        const toTest = [{}, {name: 'a'}, {name: 'c'}, {name: 'd'}];
        expect(() => Aggregate.fromArray(toTest)).toThrow();
    });
    test('Only create aggregates with existing name (EMPTY STRING)', () => {
        const toTest = [{name: ''}, {name: 'a'}, {name: 'c'}, {name: 'd'}];
        expect(() => Aggregate.fromArray(toTest)).toThrow();
    });
});

describe('Testing isValid', () => {
    test('Check for correct name', () => {
        expect(() => Aggregate.isValid({name: 'Test name'})).not.toThrow();
    });
    test('Check for correct name - throw error', () => {
        expect(() => Aggregate.isValid({})).toThrow('Missing property \'name\' inside aggregate.');
    });
});

describe('Testing fromArray', () => {
    test('Create Aggregates from array', () => {
        let elementCount = 3;
        const aggregates = [];
        while(elementCount--)
            aggregates.push({name: `Test name ${elementCount}`});
        const result = Aggregate.fromArray(aggregates);
        elementCount = 3;
        const expected = {};
        while(elementCount--) 
            expected[`Test name ${elementCount}`] = new Aggregate({name: `Test name ${elementCount}`});

        expect(result).toEqual(expected);
    });
    test('Create Aggregates from array with name duplicate', () => {
        let elementCount = 3;
        const aggregates = [{name: 'Test name 0'}];
        while(elementCount--)
            aggregates.push({name: `Test name ${elementCount}`});
    
        expect(() => Aggregate.fromArray(aggregates)).toThrow('Duplicate aggregate name \'Test name 0\'.');
    });
});

describe('Test hasProjection', () => {
    test('Instance has projection', () => {
        const eventType = 'USER_CREATED';
        const mockProjection = {
            init: ({}),
            ['USER_CREATED']: jest.fn()
        };
        const testObj = new Aggregate({name: 'Test name', projection: mockProjection});
    
        const result = testObj.hasProjection(eventType);
        expect(result).toBe(true);
    });
    test('Instance has no projection', () => {
        const eventType = 'USER_CREATED';
        const mockProjection = {
            init: ({})
        };
        const testObj = new Aggregate({name: 'Test name', projection: mockProjection});
    
        const result = testObj.hasProjection(eventType);
        expect(result).toBe(false);
    });
});

describe('Testing _reduceEvents', () => {
    test('Test correct reduction of event list', async () => {
        const mockProjection = { 
            init: 'This is no function',
            'USER_CREATED': (state, {payload}) => ({
                ...state,
                ...payload,
                registered: true
            }),
            'USER_UPDATED': (state, {payload}) => ({
                ...state,
                ...payload
            })
        };
        const testAggregate = new Aggregate({name: 'Test name', projection: mockProjection});
        expect(await testAggregate._reduceEvents(testEvents)).toEqual({name: '42'});
    });
    test('Return state if no projection available', async () => {
        const mockProjection = { 
            init: 'This is no function',
            'USER_CREATED': (state, {payload}) => ({
                ...state,
                ...payload,
                registered: true
            }),
            // 'USER_UPDATED': (state, {payload}) => ({
            //     ...state,
            //     ...payload
            // })
        };
        const testAggregate = new Aggregate({name: 'Test name', projection: mockProjection}); 
        const result = await testAggregate._reduceEvents(testEvents);
        expect(result).toEqual({});
    });
});

describe('Testing load', () => {
    test('Test event loading', async () => {
        const mockProjection = {
            init: jest.fn(() => {}),
            'USER_CREATED': (state, {payload}) => ({
                ...state,
                ...payload,
                registered: true
            }),
            'USER_UPDATED': (state, {payload}) => ({
                ...state,
                ...payload
            })
        };
        const spyInit = jest.spyOn(mockProjection, 'init');
        const testAggregate = new Aggregate({name: 'Test name', projection: mockProjection});
        const copyEvents = JSON.parse(JSON.stringify(testEvents));
        const copyEventsLength = copyEvents.length;

        const mockEventStore = {
            load: jest.fn(() => {
                return {
                    events: copyEvents,
                    cursor: null
                };
            })
        };
        const mockAggregateId = null;
        
        const result = await testAggregate.load(mockEventStore, mockAggregateId);
        const expected = {
            state: {name: '42'},
            latestEvent: {type: 'USER_UPDATED', payload: {name: '42'}}
        };
        expect(copyEvents.length).toBe(copyEventsLength - 1);
        expect(spyInit).toHaveBeenCalled();
        expect(result).toEqual(expected);
    });

    test('Test event loading - no init function', async () => {
        const mockProjection = {
            init: 'This is not a function',
            'USER_CREATED': (state, {payload}) => ({
                ...state,
                ...payload,
                registered: true
            }),
            'USER_UPDATED': (state, {payload}) => ({
                ...state,
                ...payload
            })
        };
        const testAggregate = new Aggregate({name: 'Test name', projection: mockProjection});
        const copyEvents = JSON.parse(JSON.stringify(testEvents));
        const copyEventsLength = copyEvents.length;

        const mockEventStore = {
            load: jest.fn(() => {
                return {
                    events: copyEvents,
                    cursor: null
                };
            })
        };
        const mockAggregateId = null;
        
        const result = await testAggregate.load(mockEventStore, mockAggregateId);
        const expected = {
            state: {name: '42'},
            latestEvent: {type: 'USER_UPDATED', payload: {name: '42'}}
        };

        expect(copyEvents.length).toBe(copyEventsLength - 1);
        expect(result).toEqual(expected);
    });

    test('Test event loading - empty event list', async () => {
        const mockProjection = {
            init: 'This is not a function',
            'USER_CREATED': (state, {payload}) => ({
                ...state,
                ...payload,
                registered: true
            }),
            'USER_UPDATED': (state, {payload}) => ({
                ...state,
                ...payload
            })
        };
        const testAggregate = new Aggregate({name: 'Test name', projection: mockProjection});

        const mockEventStore = {
            load: jest.fn(() => {
                return {
                    events: [],
                    cursor: null
                };
            })
        };
        const mockAggregateId = null;
        
        const result = await testAggregate.load(mockEventStore, mockAggregateId);
        const expected = {
            state: {},
            latestEvent: null
        };
        
        expect(result).toEqual(expected);
    });
});
