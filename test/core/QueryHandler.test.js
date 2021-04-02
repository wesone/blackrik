import QueryHandler from '../../src/core/QueryHandler';

describe('QueryHandler handles', () => {
    class BlackrikMock
    {
        constructor()
        {
            this._resolvers = {
                testReadModel: {
                    handlers: {
                        testResolver: jest.fn(() => {})
                    },
                    adapter: 'default'
                }
            };
            this._stores = {
                default: {test: 21}
            };
        }
    }

    test('unknown readModel', async () => {
        const queryHandler = new QueryHandler(new BlackrikMock());
        const req = {
            params: {
                readModel: 'invalidReadmodel',
                resolver: 'testResolver'
            }
        };
        expect(queryHandler.handle(req)).rejects.toThrow();
    });

    test('unknown resovler', async () => {
        const queryHandler = new QueryHandler(new BlackrikMock());
        const req = {
            params: {
                readModel: 'testReadModel',
                resolver: 'invalidResolver'
            }
        };
        expect(queryHandler.handle(req)).rejects.toThrow();
    });

    test('correct execution', async () => {
        const blackrik = new BlackrikMock();
        const queryHandler = new QueryHandler(blackrik);
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

        const resolver = blackrik._resolvers.testReadModel.handlers.testResolver;
        expect(resolver).toHaveBeenCalledTimes(2);
        expect(resolver).toHaveBeenNthCalledWith(1, blackrik._stores.default, query);
        expect(resolver).toHaveBeenNthCalledWith(2, blackrik._stores.default, {});
    });
});
