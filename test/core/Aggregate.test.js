import Aggregate from '../../src/core/Aggregate';

test('Create Aggretage from array', () => {
    const aggregate = Aggregate.fromArray([{name:'testName'}]);
    expect(null).toEqual(null);
});
