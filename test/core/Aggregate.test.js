<<<<<<< HEAD
=======
import { test } from '../../src/assets/configScheme';
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
    test('', () => {
        const testAggregate = new Aggregate({name: 'Noice name'});
        
    });
});

describe('Testing load', () => {
    test('', () => {
        const testAggregate = new Aggregate({name: 'Noice name'});
        
    });
});
>>>>>>> 1006a06ff6e67e231c5e5f1ac865a6335b3c430f
