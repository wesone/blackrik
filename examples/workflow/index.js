const Blackrik = require('blackrik');
const config = require('./config');

(async () => {
    blackrik = await (new Blackrik(config)).start();
})();
