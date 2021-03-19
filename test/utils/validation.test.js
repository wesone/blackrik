const {validateConfig} = require('../../src/utils/validation');
const template = require('../../examples/hello-world/exampleInstance');

test('Validate config scheme', () => {
    expect(() => validateConfig(template)).not.toThrow();
});
