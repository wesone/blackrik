const Errors = require('../../src/core/Errors');

test('All errors have the properties code (Number) and message (String)', () => {
    const errors = Object.values(Errors);
    errors.forEach(errorClass =>{
        const error = new errorClass();
        expect(error.code).toEqual(expect.any(Number));
        expect(error.message).toEqual(expect.any(String));
    });
});

test('All errors can have a custom message', () => {
    const errors = Object.values(Errors);
    const message = 'Test message';
    errors.forEach(errorClass =>{
        const error = new errorClass(message);
        expect(error.code).toEqual(expect.any(Number));
        expect(error.message).toEqual(message);
    });
});

test('BaseError can have a custom code', () => {
    const {BaseError} = Errors;
    const message = 'Test message';
    const code = 42;
    const error = new BaseError(message, code);
    expect(error.code).toEqual(code);
    expect(error.message).toEqual(message);
});
