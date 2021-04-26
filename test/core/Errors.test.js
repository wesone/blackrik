const Errors = require('../../src/core/Errors');

test('All errors have the properties status (Number) and message (String)', () => {
    Object.values(Errors).forEach(errorClass =>{
        const error = new errorClass();
        expect(error.status).toEqual(expect.any(Number));
        expect(error.message).toEqual(expect.any(String));
    });
});

test('All errors can have a custom message', () => {
    const message = 'Test message';
    Object.values(Errors).forEach(errorClass =>{
        const error = new errorClass(message);
        expect(error.status).toEqual(expect.any(Number));
        expect(error.message).toEqual(message);
    });
});

test('BaseError can have a custom status', () => {
    const {BaseError} = Errors;
    const message = 'Test message';
    const status = 42;
    const error = new BaseError(message, status);
    expect(error.status).toEqual(status);
    expect(error.message).toEqual(message);
});
