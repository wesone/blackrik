class QueryHandler 
{
    #blackrik;

    constructor(blackrik)
    {
        this.#blackrik = blackrik;
        return this.handle.bind(this);
    }

    async handle(req, res)
    {
        const {readModel, resolver} = req.params;

        if(!Object.prototype.hasOwnProperty.call(this.#blackrik._resolvers, readModel))
            return res.sendStatus(404).end(); //TODO error for invalid readmodel

        const {source: resolvers, adapter} = this.#blackrik._resolvers[readModel];

        if(!Object.prototype.hasOwnProperty.call(resolvers, resolver))
            return res.sendStatus(404).end(); //TODO error for invalid resolver

        const response = await resolvers[resolver](this.#blackrik._stores[adapter], req.query);
        res.json(response);
    }
}

module.exports = QueryHandler;
