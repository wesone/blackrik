const RequestHandler = require('../../src/core/RequestHandler');
const {BaseError} = require('../../src/core/Errors');

describe('A new RequestHandler', () => {
    test('expects a function as parameter', () => {
        expect(() => new RequestHandler()).toThrow();
        expect(() => new RequestHandler(42)).toThrow();
        expect(() => new RequestHandler(function(){})).not.toThrow();
        expect(() => new RequestHandler(() => {})).not.toThrow();
    });

    test('returns a function', () => {
        expect(new RequestHandler(() => {})).toBeInstanceOf(Function);
    });
});

describe('RequestHandler', () => {
    class Req
    {
        constructor()
        {
            return {test: 42};
        }
    }

    class Res
    {
        closed = false;
        statusCode;
        data;

        _checkConnection()
        {
            if(this.closed)
                throw Error('Connection was alread closed.');
        }

        end()
        {
            this.closed = true;
        }

        send(data)
        {
            this._checkConnection();
            this.data = String(data);
            return this;
        }

        json(data)
        {
            return this.send(JSON.stringify(data));
        }

        status(status)
        {
            this._checkConnection();
            this.statusCode = status;
            return this;
        }
        
        sendStatus(status)
        {
            if(status === 500) // no need to mock other status codes here
                this.send('Internal Error');
            this.status(status).end();
            return this;
        }
    }

    const createReq = () => new Req();
    const createRes = () => new Res();

    beforeAll(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterAll(() => {
        console.error.mockRestore();
    });
    afterEach(() => {
        console.error.mockClear();
    });

    test('wraps handler inside an Express callback', async () => {
        const handler = jest.fn(() => {});

        const req = createReq();
        const res = createRes();
        await (new RequestHandler(handler))(req, res);

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenNthCalledWith(1, req, res);
    });

    test('processes returned handler value correctly', async () => {
        const createValue = req => ({test: req.test/2});
        const handler = jest.fn(req => createValue(req));

        const req = createReq();
        const res = createRes();
        await (new RequestHandler(handler))(req, res);

        expect(res.data).toBe(JSON.stringify(createValue(req)));
    });

    test('handles exceptions inside the handler correctly', async () => {
        const error = new BaseError('I\'m a teapot', 418);
        const handler = jest.fn(() => {throw error;});
        
        const res = createRes();
        await (new RequestHandler(handler))(createReq(), res);

        expect(res.statusCode).toBe(error.status);
        expect(res.data).toBe(error.message);
    });

    test('does not expose critical errors', async () => {
        const errorMessage = 'Critical error with sensitive data';
        const handler = jest.fn(() => {throw Error(errorMessage);});
        
        const res = createRes();
        await (new RequestHandler(handler))(createReq(), res);

        expect(res.statusCode).toBe(500);
        expect(res.data).not.toBe(errorMessage);
    });

    test('falls back to toString for errors without message property', async () => {
        class CustomError
        {
            constructor()
            {
                this.msg = 'Error message';
                this.status = 418;
            }

            toString()
            {
                return this.msg;
            }
        }
        const error = new CustomError();
        const handler = jest.fn(() => {throw error;});
        
        const res = createRes();
        await (new RequestHandler(handler))(createReq(), res);

        expect(res.statusCode).toBe(error.status);
        expect(res.data).toBe(error.msg);
    });
});

