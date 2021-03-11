import Adapter from '../../src/core/Adapter';
  
describe('Testing Adapter.create', () => {
    const testMsg = 'create(args) has been called';
    const modulePath = `${__dirname}/AdapterMock`;

    test('Create Adapter - success', () => {
        const config = {
            module: modulePath,
            args: testMsg
        };
        const adapter = Adapter.create(config);
        expect(adapter).toEqual(testMsg);
    });

    test('Create Adapter without config', () => {
        expect(Adapter.create(undefined)).toEqual(null);
    });

    test('Create Adapter without args', () => {
        const config = {
            module: modulePath,
            args: null,
        };
        const adapter = Adapter.create(config);
        expect(adapter).toEqual(null);
    });
});
