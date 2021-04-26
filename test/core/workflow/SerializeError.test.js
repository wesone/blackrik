const {serializeError, deserializeError} = require('../../../src/core/workflow/SerializeError');

const error = new Error('Test');
error.test = {test2: 'Error', error, fn: () => {}, buf: Buffer.alloc(1), errors: [error]};

test('SerializeError', () => {
    expect(serializeError(1)).toEqual(1);
    expect(serializeError(() => {})).toEqual('[Function: anonymous]');
    expect(deserializeError(serializeError(error))).toEqual(error);
    expect(deserializeError(serializeError(error))).toEqual(error);
    expect(deserializeError(error)).toEqual(error);
    expect(deserializeError(1)).toBeInstanceOf(Error);
});

test('toJSON', () => {
    class CustomError extends Error {
        constructor(value){
            super('foo');
            this.name = this.constructor.name;
            this.value = value;
        }
    }
    const value = {
        amount: 20,
        toJSON(){
            return {
                amount: `$${this.amount}`
            };
        }
    };
    const error = new CustomError(value);
    const serialized = serializeError(error);
    const {stack, ...rest} = serialized;

    expect(rest).toMatchObject({
        message: 'foo',
        name: 'CustomError',
        value: {
            amount: '$20'
        }
    });

    expect(stack).toBeDefined();
});

test('toJSON Error', () => {
    const deserialized = deserializeError(BigInt(1));

    expect(deserialized).toBeInstanceOf(Error);
});

