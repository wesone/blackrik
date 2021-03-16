const {NotFoundError} = require('./Errors');

class QueryHandler 
{
    #blackrik;

    constructor(blackrik)
    {
        this.#blackrik = blackrik;
    }

    async handle(req)
    {
        const {readModel, resolver} = req.params;
        return await this.process(readModel, resolver, req.query);
    }

    async process(readModel, resolver, query = {})
    {
        if(!Object.prototype.hasOwnProperty.call(this.#blackrik._resolvers, readModel))
            throw new NotFoundError('Unknown ReadModel');

        const {source: resolvers, adapter} = this.#blackrik._resolvers[readModel];

        if(!Object.prototype.hasOwnProperty.call(resolvers, resolver))
            throw new NotFoundError('Unknown resolver');

        return await resolvers[resolver](this.#blackrik._stores[adapter], query);
    }
}

module.exports = QueryHandler;
