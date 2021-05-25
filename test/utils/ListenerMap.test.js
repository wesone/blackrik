const ListenerMap = require('../../src/utils/ListenerMap');

describe('ListenerMap', () => {
    test('executes callbacks for multiple types', () => {
        const listenerMap = new ListenerMap();

        const callbacks = [];
        const parameters = ['argument1', 'argument2'];
        const types = ['type1', 'type2', 'type3'];

        // there will be:
        // 2 callbacks for type1
        // 1 callback for type2
        // 1 callback for type3
        ['type1', ...types].forEach(type => {
            const callback = jest.fn((...args) => {
                if(args.length !== parameters.length)
                    return null;
                return args;
            });
            callbacks.push(callback);
            listenerMap.add(type, callback);
        });
        
        listenerMap.execute(types[0], ...parameters);
        listenerMap.execute(types[1], ...parameters);
        listenerMap.execute(types[1], ...parameters);

        expect(callbacks[0]).toHaveBeenCalledTimes(1);
        expect(callbacks[0]).toHaveBeenNthCalledWith(1, ...parameters);

        expect(callbacks[1]).toHaveBeenCalledTimes(1);
        expect(callbacks[1]).toHaveBeenNthCalledWith(1, ...parameters);

        expect(callbacks[2]).toHaveBeenCalledTimes(2);
        expect(callbacks[2]).toHaveBeenNthCalledWith(1, ...parameters);
        expect(callbacks[2]).toHaveBeenNthCalledWith(2, ...parameters);

        expect(callbacks[3]).toHaveBeenCalledTimes(0);
    });

    test('returns an array of callback executions', async () => {
        const listenerMap = new ListenerMap();

        const type = 'type1';
        const errorMessage = 'Test error';
        listenerMap.add(type, async () => {});
        listenerMap.add(type, async () => {throw errorMessage;});
        listenerMap.add(type, async () => {});

        const executions = listenerMap.execute(type);

        expect(executions).toHaveLength(3);
        expect(Promise.all(executions)).rejects.toBe(errorMessage);
    });

    test('handles callbacks that were added after a call to execute', async () => {
        const listenerMap = new ListenerMap();

        const callbacks = [];
        const addCallback = type => {
            const callback = jest.fn(() => {});
            callbacks.push(callback);
            listenerMap.add(type, callback);
        };

        const types = ['type1', 'type2'];
        types.forEach(addCallback);

        expect(listenerMap.execute(types[0])).toHaveLength(1);
        expect(listenerMap.execute(types[1])).toHaveLength(1);
        addCallback(types[0]);
        expect(listenerMap.execute(types[0])).toHaveLength(2);
        expect(listenerMap.execute(types[1])).toHaveLength(1);

        expect(callbacks[0]).toHaveBeenCalledTimes(2);
        expect(callbacks[1]).toHaveBeenCalledTimes(2);
        expect(callbacks[2]).toHaveBeenCalledTimes(1);
    });

    test('returns empty array if there are no registered callbacks', async () => {
        const listenerMap = new ListenerMap();
        const type = 'type1';
        expect(listenerMap.execute(type)).toHaveLength(0);
    });
});

describe('Can execute callbacks', () => {
    const listenerMap = new ListenerMap();
    const type = 'type1';
    const callbackDurations = [2, 4, 3];
    callbackDurations.forEach(duration => listenerMap.add(type, async () => new Promise(r => setTimeout(r, duration))));

    test('concurrently', async () => {
        const now = Date.now();
        await listenerMap.execute(type);
        const duration = Date.now() - now;

        expect(duration).toBeLessThan(callbackDurations.reduce((acc, value) => acc + value));
    });

    test('in series', async () => {
        const now = Date.now();
        await listenerMap.iterate(type);
        const duration = Date.now() - now;

        expect(duration).toBeGreaterThan(Math.max(...callbackDurations));

        expect(await listenerMap.iterate('unknowntype')).toBe(undefined);
    });
});
