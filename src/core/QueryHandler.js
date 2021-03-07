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

        if(!Object.prototype.hasOwnProperty.call(this.#blackrik._readModels, readModel))
            return res.sendStatus(404).end(); //TODO error for invalid readmodel
        if(!Object.prototype.hasOwnProperty.call(this.#blackrik._readModels[readModel].resolvers, resolver))
            return res.sendStatus(404).end(); //TODO error for invalid resolver

        const model = this.#blackrik._readModels[readModel];
        const store = this.#blackrik._stores[model.adapter];
        const response = await model.resolvers[resolver](store, req.query);
        res.json(response);
    }
}

module.exports = QueryHandler;
