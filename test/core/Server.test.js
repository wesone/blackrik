const Server = require('../../src/core/Server');
const request = require('axios');
const WebSocket = require('ws');

test('Optional config', () => {
    expect(() => new Server()).not.toThrow();
});

test('Unnecessary call to stop()', () => {
    const server = new Server();
    expect(server.stop()).resolves.not.toThrow();
});

describe('Server handles', () => {
    jest.setTimeout(10000);
    const port = 4242;
    const url = `http://localhost:${port}`;
    const createServer = (config = {port}) => new Server(config);

    beforeAll(() => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });
    afterAll(() => {
        console.log.mockRestore();
    });

    test('custom routes', async () => {
        const server = createServer();
        const path = '/test';
        server.route(path).get((req, res) => {
            res.json({value: parseInt(req.query.testValue)});
        });

        await server.start();
        const testValue = 42;
        const response = await request.get(`${url}${path}`, {
            params: {testValue}
        });
        await server.stop();

        expect(response.status).toBe(200);
        expect(response.data).toStrictEqual({value: testValue}); 
    });

    test('custom middlewares', async () => {
        const server = createServer();
        const testValue = 42;
        server.use((...[req, , next]) => (req.test = testValue) && next());

        const path = '/test';
        server.route(path).get((req, res) => {
            res.json({value: req.test});
        });

        await server.start();
        const response = await request.get(`${url}${path}`);
        await server.stop();

        expect(response.status).toBe(200);
        expect(response.data).toStrictEqual({value: testValue}); 
    });

    test('websockets', async () => {
        const server = createServer();

        const path = '/test';
        server.ws(path, (ws/* , req */) => {
            ws.on('message', msg => {
                ws.send(msg.split('').reverse().join(''));
            });
        });

        await server.start();
        const messages = [];
        let onClosed;
        const closePromise = new Promise(resolve => (onClosed = resolve));
        const client = new WebSocket(`${url}${path}`);
        client.on('close', onClosed);
        client.on('message', msg => messages.push(msg));
        await new Promise(resolve => client.once('open', resolve));
        client.send('areahps');
        client.send('ENSW');
        client.close();
        await closePromise;
        await server.stop();

        expect(messages).toStrictEqual([
            'sphaera',
            'WSNE'
        ]); 
    });

    test('default middlewares secure Express', async () => {
        const getSampleResponse = async config => {
            const server = createServer(config);
            const path = '/test';
            server.route(path).get((req, res) => {
                res.json({route: req.route});
            });

            await server.start();
            const response = await request.get(`${url}${path}`);
            await server.stop();
            return response;
        };
        
        expect((await getSampleResponse({port, skipDefaultMiddlewares: true})).headers['x-powered-by']).toBe('Express');
        expect((await getSampleResponse({port, skipDefaultMiddlewares: false})).headers['x-powered-by']).toBeUndefined();
    });
});
