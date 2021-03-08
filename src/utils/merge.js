const deepmerge = require('deepmerge');

module.exports = (...objects) => deepmerge.all(objects, {
    isMergeableObject: obj => !!(obj !== undefined && obj !== null && obj.constructor === Object || Array.isArray(obj))
});
