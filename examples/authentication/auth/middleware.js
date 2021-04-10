const {ForbiddenError} = require('../errors');
const {COOKIE_NAME} = require('./config');
const {decode} = require('jsonwebtoken');
const parseCookies = value => value
    .split(';')
    .filter(v => v !== '')
    .map(v => v.split('='))
    .reduce((acc, [k, v]) => (acc[decodeURIComponent(k.trim())] = decodeURIComponent(v.trim())) && acc, {});

module.exports = (req, res, next) => {
    const token = parseCookies(req.headers.cookie || '')[COOKIE_NAME];
    req.user = token
        ? decode(token)
        : null;

    // if the user is not logged in, do not allow calling /query or /commands (unless the user wants to register)
    if(
        !req.user && 
        (
            req.path.startsWith('/query') || 
            req.path.startsWith('/commands') && !(req.body.aggregateName === 'user' && req.body.type === 'register')
        )
    )
       throw new ForbiddenError();

    next();
};
