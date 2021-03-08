const deepmerge = require('deepmerge');

module.exports = (...objects) => deepmerge.all(objects, {
    isMergeableObject: obj => {
        return !!(obj !== undefined && obj !== null && obj.constructor === Object || Array.isArray(obj));
    }
});
