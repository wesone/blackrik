const deepmerge = require('deepmerge');

module.exports = (...objects) => deepmerge.all(objects, {
    isMergeableObject: obj => {
        if(
            obj !== undefined && obj !== null && obj.constructor === Object ||
            Array.isArray(obj)
        )
            return true;
        return false;
    }
});
