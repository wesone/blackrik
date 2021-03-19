const Blackrik = require('../../');
const exampleInstance = require('./exampleInstance');

(async () => {
    blackrik = await (new Blackrik(exampleInstance)).start();
})();
