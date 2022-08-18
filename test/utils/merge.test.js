const merge = require('../../src/utils/merge');

test('merge two objects', () => {
    const obj1 = {test1: 1, sub: {one: 21}};
    const obj2 = {test2: 'test2', sub: {two: 84, one: 42}};
    const expected = {
        test1: 1,
        test2: 'test2',
        sub: {
            one: 42,
            two: 84
        }
    };
    const merged = merge(obj1, obj2);
    expect(merged).toStrictEqual(expected);
});
