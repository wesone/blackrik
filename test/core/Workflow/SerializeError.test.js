const {serializeError, deserializeError} = require('../../../src/core/Workflow/SerializeError');

const error = new Error('Test');
error.test = {test2: 'Error', error, fn: () => {}, buf: Buffer.alloc(1)};

test('SerializeError', () => {
    expect(serializeError(1)).toEqual(1);
    expect(serializeError(() => {})).toEqual('[Function: anonymous]');
    expect(deserializeError(serializeError(error))).toEqual(error);
    expect(deserializeError(serializeError(error))).toEqual(error);
    expect(deserializeError(error)).toEqual(error);
    expect(deserializeError(1)).toBeInstanceOf(Error);
});
