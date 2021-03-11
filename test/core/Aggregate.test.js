import Aggregate from '../../src/core/Aggregate';

describe('Testing fromArray', () => {
    test('Create Aggregate from array', () => {
        const toTest = [{name: 'a'}, {name: 'b'}, {name: 'c'}, {name: 'd'} ];
        const expected = {'a': {'commands': undefined, 'name': 'a', 'projection': undefined}, 
            'b': {'commands': undefined, 'name': 'b', 'projection': undefined}, 
            'c': {'commands': undefined, 'name': 'c', 'projection': undefined}, 
            'd': {'commands': undefined, 'name': 'd', 'projection': undefined}};
        expect(Aggregate.fromArray(toTest)).toEqual(expected);
    });
    test('Only create aggregates with different names', () => {
        const toTest = [{name: 'a'}, {name: 'a'}, {name: 'c'}, {name: 'd'} ];
        expect(() => Aggregate.fromArray(toTest)).toThrow();
    });
    test('Only create aggregates with existing name (EMPTY OBJECT)' , () => {
        const toTest = [{}, {name: 'a'}, {name: 'c'}, {name: 'd'} ];
        expect(() => Aggregate.fromArray(toTest)).toThrow();
    });
    test('Only create aggregates with existing name (EMPTY STRING)', () => {
        const toTest = [{name: ''}, {name: 'a'}, {name: 'c'}, {name: 'd'} ];
        expect(() => Aggregate.fromArray(toTest)).toThrow();
    });
});

describe('Testing _loadEvents', () => {
    test('Test event loading', () => {
        const testAggregate = new Aggregate({name: 'Noice name'});
        // TODO: Mock eventstore 
    });
});

describe('Testing _reduceEvents', () => {
    const events = [
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
                name: '4'
            }
        }
    ];
    test('Test correct reduction of event list', () => {
        const mockProjection = { 
            init: jest.fn(() => {}),
            'USER_CREATED': (state, event) => ({
                ...state
            }),
            'USER_UPDATED': (state, {payload}) => ({
                ...state,
                ...payload
            })
        };
        const testAggregate = new Aggregate({name: 'Noice name', projection: mockProjection});
        expect(testAggregate._reduceEvents(events)).toEqual({name: '4'});
        // init function called once
        expect(mockProjection.init.mock.calls.length).toBe(1);
    });
    test('Test correct reduction without init function', () => {
        const mockProjection1 = { 
            init: 'This is no function',
            // 'USER_CREATED': () => jest.fn(state, event) {
            //     ...state
            // },
            'USER_CREATED': (state, event) => ({
                ...state
            }),
            'USER_UPDATED': (state, {payload}) => ({
                ...state,
                ...payload
            })
        };
        const testAggregate = new Aggregate({name: 'Noice name', projection: mockProjection1});
        expect(testAggregate._reduceEvents(events)).toEqual({name: '4'});
    });
});

// Already testet _reduceEvents and _loadEvents
// describe('Testing load', () => {
//     test('', () => {
//         const testAggregate = new Aggregate({name: 'Noice name'});
        
//     });
// });
