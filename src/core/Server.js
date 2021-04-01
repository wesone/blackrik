const express = require('express');
const merge = require('../utils/merge');

class Server 
{
    #config = {
        port: 3000,
        skipDefaultMiddlewares: false
    };
    #app = null;
    #server = null;

    constructor(config = {})
    {
        this.config = merge(this.#config, config);

        this.#app = express();
        this._addDefaultSettings();
        this._addDefaultMiddlewares();
    }

    _addDefaultSettings()
    {
        this.#app.set('json spaces', 2); // number of spaces for indentation
    }

    _addDefaultMiddlewares()
    {
        // https://www.npmjs.com/package/express-ws
        /* const expressWs =  */require('express-ws')(this.#app);

        // https://www.npmjs.com/package/body-parser
        const bodyParser = require('body-parser');
        this.#app.use(bodyParser.json({type: ['application/json']}));
        
        if(!this.config.skipDefaultMiddlewares)
        {
            // https://www.npmjs.com/package/helmet
            this.#app.use(require('helmet')());
            
            // https://www.npmjs.com/package/compression
            this.#app.use(require('compression')());
        }
    }

    use(...args)
    {
        return this.#app.use(...args);
    }

    route(...args)
    {
        return this.#app.route(...args);
    }

    ws(...args)
    {
        return this.#app.ws(...args);
    }

    async start()
    {
        return new Promise(resolve => {
            this.#server = this.#app.listen(this.config.port, () => {
                console.log('Application started on port', this.config.port);
                resolve();
            });
        });    
    }

    async stop()
    {
        if(this.#server)
            await new Promise(resolve => this.#server.close(resolve));
        this.#server = null;
    }
}

module.exports = Server;
