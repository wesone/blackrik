class RequestHandler
{
    #handler;

    // This is a workaround for Express < 5
    // See http://expressjs.com/en/guide/error-handling.html
    // When Express is able to handle errors in async functions that are not properly passed to next(),
    // we can add an error handling middleware instead of using this callback wrapper
    static catch(callback)
    {
        return async (req, res, ...rest) => {
            try
            {
                await callback(req, res, ...rest);
            }
            catch(e)
            {
                if(!e.status)
                {
                    console.error(e);
                    return res.sendStatus(500).end(); // do not expose critical errors
                }
                return res.status(e.status).send(e.message || e).end();
            }
        };
    }

    constructor(handler)
    {
        if(typeof handler !== 'function')
            throw Error('RequestHandler expects parameter 1 to be of type function.');

        this.#handler = handler;
        return RequestHandler.catch(this.handle.bind(this));
    }

    async handle(req, res)
    {
        const response = await this.#handler(req, res);
        if(response === undefined)
            return res.sendStatus(200).end();
        res.json(response).end();
    }
}

module.exports = RequestHandler;
