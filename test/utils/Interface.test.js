const Interface = require('../../src/utils/Interface');

describe('Interface', () => {
    test('allows a correct implementation', () => {
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

    test('allows an undefined scheme', () => {
        class ValidClass extends Interface
        {
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

    test('detects a missing function', () => {
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

    test('detects a wrong type', () => {
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
});
