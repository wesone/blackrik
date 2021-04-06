const Adapter = require('../../src/core/Adapter');

test('Create adapter without config', () => {
    const adapter = Adapter.create();
    expect(adapter).toBeNull();
});

describe('Create adapter with config', () => {
    beforeAll(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterAll(() => {
        console.error.mockRestore();
    });
    afterEach(() => {
        console.error.mockClear();
    });

    const args = 42;

    test('but without module', () => {
        const adapter = Adapter.create({
            args
        });
        expect(adapter).toBeNull();
    });

    test('but with invalid module', () => {
        const adapter = Adapter.create({
            module: '$invalid$',
            args
        });
        expect(adapter).toBeNull();
    });

    test('but the module does not expose a function', () => {
        const adapter = Adapter.create({
            module: __dirname + '/../mock/Adapter/Invalid',
            args
        });
        expect(adapter).toBeNull();
    });

    test('and a valid module that exposes a function', () => {
        const adapter = Adapter.create({
            module: __dirname + '/../mock/Adapter/Valid',
            args
        });
        expect(adapter).toBe(args);
    });
});
