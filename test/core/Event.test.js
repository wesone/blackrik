const Event = require('../../src/core/Event');

test('constructor does not allow infiltrated values', () => {
    const id = 'infiltrated';
    const timestamp = 42;
    const event = new Event({id, timestamp});
    expect(event.id).not.toBe(id);
    expect(event.timestamp).not.toBe(timestamp);
});

test('Event.from does allow infiltrated values', () => {
    const id = 'infiltrated';
    const timestamp = 42;
    const event = Event.from({id, timestamp});
    expect(event.id).toBe(id);
    expect(event.timestamp).toBe(timestamp);
});

test('can be JSON serialized', () => {
    const event = new Event({});
    expect(event.toJSON()).toBeInstanceOf(Object);
});
