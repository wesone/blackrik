import Adapter from '../../src/core/Adapter';

describe('Testing Adapter.create', () => {
    test('Create Adapter - success', () => {
        const config = {
            module: 'Adapter',// todo require mocken
            args: () => 'Adapter'
        };
        const adapter = Adapter.create(config);
        expect(adapter).toEqual(null);
    });

    test('Create Adapter without config', () => {
        expect(Adapter.create(undefined)).toEqual(null);
    });

    test('Create Adapter without args', () => {
        const config = {
            module: 'Adapter', // todo require mocken
            args: undefined
        };
        const adapter = Adapter.create(config);
        expect(adapter).toEqual(null);
    });
});
