class QueryHandler 
{
    constructor()
    {
        return this.handle;
    }

    async handle(req, res)
    {
        console.log('EXECUTE QUERY');
    }
}

module.exports = QueryHandler;
