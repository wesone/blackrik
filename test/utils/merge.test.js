import merge from '../../src/utils/merge';

test('Merge two objects', () => {
    const obj1 = { test1: 1 };
    const obj2 = { test2: 'test2' };
    const expected = {
        test1: 1,
        test2: 'test2'
    };
    const merged = merge(obj1, obj2);
    expect(merged).toEqual(expected);
});
