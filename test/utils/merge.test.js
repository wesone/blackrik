import merge from '../../src/utils/merge';

test('Check if the Objects can be merged', () => {
    const obj1 = { test1: 1 };
    const obj2 = { test2: 'test2' };
    const mergable = merge([obj1, obj2]);
    expect(mergable).toBe(true);
});
