module.exports = (req = null) => {
    return {
        user: req?.user ?? 'system'
    };
};
