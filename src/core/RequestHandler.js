class RequestHandler
{
    #handler;

    constructor(handler)
    {
        this.#handler = handler;
        return this.handle.bind(this);
    }

    async handle(req, res)
    {
        try
        {
            const response = this.#handler(req);
            if(!response)
                return res.sendStatus(200).end();
            res.json(response).end();
        }
        catch(e)
        {
            if(!e.status)
                console.error(e);
            return res.status(e.status || 500).send(e.message || e).end();
        }
    }
}

module.exports = RequestHandler;
