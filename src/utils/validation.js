const configScheme = require('../resources/configScheme');

module.exports = {
    validateConfig: config => configScheme.validateSync(config)
};
