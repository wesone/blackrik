const Q = require('../../src/utils/Q');

test('Correct length of queue', () => {
    const queue = new Q();
    queue.add(() => Promise.resolve);
    queue.add(() => Promise.resolve);
    
    expect(queue.length).toBe(2);
});

test('Items must be functions', () => {
    const queue = new Q();

    expect(() => queue.add(42)).toThrow();
    expect(() => queue.add('string')).toThrow();
    expect(() => queue.add(() => {})).not.toThrow();
});

test('Correct execution order', async () => {
    const queue = new Q();
    const items = {
        first: 5,
        second: 1
    };
    const results = [];

    const promises = Object.entries(items).map(([value, duration]) => queue.add(async () => 
        results.push(
            await new Promise(r => setTimeout(() => r(value), duration))
        )
    ));
    await Promise.all(promises);

    Object.keys(items).forEach((value, idx) => expect(results[idx]).toBe(value));
});
