const Interface = require('../../src/utils/Interface');

test('Interface implemented correctly', () => {
    class ValidClass extends Interface
    {
        constructor()
        {
            super({
                test: 'function',
                test2: 'function',
                test3: 'boolean'
            });
        }

        get test3()
        {
            return true;
        }

        test()
        {

        }

        test2()
        {

        }
    }
    expect(() => new ValidClass()).not.toThrow();
});

test('Interface missing function', () => {
    class InvalidClass extends Interface
    {
        constructor()
        {
            super({
                test: 'function',
                test2: 'function',
                test3: 'boolean'
            });
        }

        get test3()
        {
            return true;
        }

        test()
        {

        }
    }
    expect(() => new InvalidClass()).toThrow();
});

test('Interface wrong type', () => {
    class InvalidClass extends Interface
    {
        constructor()
        {
            super({
                test: 'function',
                test2: 'function',
                test3: 'boolean'
            });
        }

        get test3()
        {
            return 'true';
        }

        test()
        {

        }

        test2()
        {

        }
    }
    expect(() => new InvalidClass()).toThrow();
});
