'use strict';

/*

MIT License

Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


*/

class NonError extends Error {
    constructor(message){
        super(NonError._prepareSuperMessage(message));
        Object.defineProperty(this, 'name', {
            value: 'NonError',
            configurable: true,
            writable: true
        });
       
        Error.captureStackTrace(this, NonError);
    }

    static _prepareSuperMessage(message){
        try 
        {
            return JSON.stringify(message);
        } 
        catch
        {
            return String(message);
        }
    }
}

const commonProperties = [
    {property: 'name', enumerable: false},
    {property: 'message', enumerable: false},
    {property: 'stack', enumerable: false},
    {property: 'code', enumerable: true}
];

const isCalled = Symbol('.toJSON called');

const toJSON = from => {
    from[isCalled] = true;
    const json = from.toJSON();
    delete from[isCalled];
    return json;
};

const destroyCircular = ({
    from,
    seen,
    to_,
    forceEnumerable
}) => {
    const to = to_ || (Array.isArray(from) ? [] : {});

    seen.push(from);

    if(typeof from.toJSON === 'function' && from[isCalled] !== true)
    {
        return toJSON(from);
    }

    for(const [key, value] of Object.entries(from))
    {
        if(typeof Buffer === 'function' && Buffer.isBuffer(value))
        {
            to[key] = '[object Buffer]';
            continue;
        }

        if(typeof value === 'function')
        {
            continue;
        }

        if(!value || typeof value !== 'object')
        {
            to[key] = value;
            continue;
        }

        if(!seen.includes(from[key]))
        {
            to[key] = destroyCircular({
                from: from[key],
                seen: seen.slice(),
                forceEnumerable
            });
            continue;
        }

        to[key] = '[Circular]';
    }

    for(const {property, enumerable} of commonProperties)
    {
        if(typeof from[property] === 'string')
        {
            Object.defineProperty(to, property, {
                value: from[property],
                enumerable: forceEnumerable ? true : enumerable,
                configurable: true,
                writable: true
            });
        }
    }

    return to;
};

const serializeError = value => {
    if(typeof value === 'object' && value !== null)
    {
        return destroyCircular({
            from: value,
            seen: [],
            forceEnumerable: true
        });
    }

    // People sometimes throw things besides Error objects…
    if(typeof value === 'function')
    {
        // `JSON.stringify()` discards functions. We do too, unless a function is thrown directly.
        return `[Function: ${(value.name || 'anonymous')}]`;
    }

    return value;
};

const deserializeError = value => {
    if(value instanceof Error)
    {
        return value;
    }

    if(typeof value === 'object' && value !== null && !Array.isArray(value))
    {
        const newError = new Error();
        destroyCircular({from: value, seen: [], to_: newError});
        return newError;
    }

    return new NonError(value);
};

module.exports = {
    serializeError,
    deserializeError
};
