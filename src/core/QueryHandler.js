const {NotFoundError} = require('./Errors');

class QueryHandler 
{
    #blackrik;

    constructor(blackrik)
    {
        this.#blackrik = blackrik;
        this.handle = this.handle.bind(this);
    }

    async handle(req)
    {
        const {readModel, resolver} = req.params;
        return await this.process(readModel, resolver, req.query, this.#blackrik.buildContext(req));
    }

    async process(readModel, resolver, query = {}, context = {})
    {
        if(!Object.prototype.hasOwnProperty.call(this.#blackrik._resolvers, readModel))
            throw new NotFoundError('Unknown ReadModel');

        const {handlers, adapter} = this.#blackrik._resolvers[readModel];

        if(!Object.prototype.hasOwnProperty.call(handlers, resolver))
            throw new NotFoundError('Unknown resolver');

        return await handlers[resolver](this.#blackrik._stores[adapter], query, context);
    }
}

module.exports = QueryHandler;
