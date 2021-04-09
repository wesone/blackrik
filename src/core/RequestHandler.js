class RequestHandler
{
    #handler;

    constructor(handler)
    {
        if(typeof handler !== 'function')
            throw Error('RequestHandler expects parameter 1 to be of type function.');

        this.#handler = handler;
        return this.handle.bind(this);
    }

    async handle(req, res)
    {
        try
        {
            const response = await this.#handler(req);
            if(response === undefined)
                return res.sendStatus(200).end();
            res.json(response).end();
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
    }
}

module.exports = RequestHandler;
