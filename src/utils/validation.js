const configScheme = require('../assets/configScheme');

module.exports = {
    validateConfig: config => configScheme.validateSync(config)
};
