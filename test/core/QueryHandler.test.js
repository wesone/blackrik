const QueryHandler = require('../../src/core/QueryHandler');
const BlackrikMock = require('../_mock/Blackrik');

describe('QueryHandler handles', () => {
    let blackrik;
    let queryHandler;
    beforeEach(() => {
        blackrik = new BlackrikMock();
        queryHandler = new QueryHandler(blackrik);
    });

    test('unknown readModel', async () => {
        const req = {
            params: {
                readModel: 'invalidReadmodel',
                resolver: 'testResolver'
            }
        };
        expect(queryHandler.handle(req)).rejects.toThrow();
    });

    test('unknown resovler', async () => {
        const req = {
            params: {
                readModel: 'testReadModel',
                resolver: 'invalidResolver'
            }
        };
        expect(queryHandler.handle(req)).rejects.toThrow();
    });

    test('correct execution', async () => {
        const query = {test: 42};
        const req = {
            params: {
                readModel: 'testReadModel',
                resolver: 'testResolver'
            },
            query
        };
        const req2 = {
            params: {
                readModel: 'testReadModel',
                resolver: 'testResolver'
            }
        };
        expect(queryHandler.handle(req)).resolves.not.toThrow();
        expect(queryHandler.handle(req2)).resolves.not.toThrow();
        expect(queryHandler.process(req.params.readModel, req.params.resolver)).resolves.not.toThrow();

        const resolver = blackrik._resolvers.testReadModel.handlers.testResolver;
        expect(resolver).toHaveBeenCalledTimes(3);
        expect(resolver).toHaveBeenNthCalledWith(1, blackrik._stores.default, query, blackrik.buildContext({}));
        expect(resolver).toHaveBeenNthCalledWith(2, blackrik._stores.default, {}, blackrik.buildContext({}));
        expect(resolver).toHaveBeenNthCalledWith(3, blackrik._stores.default, {}, {});
    });
});
