process.env.TZ = 'Europe/Berlin';

module.exports = {
    testEnvironment: 'node',
    transform: {
        '^.+\\.js$': 'babel-jest',
    },
};
