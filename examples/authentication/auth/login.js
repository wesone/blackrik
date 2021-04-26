const {BadRequestError, UnauthorizedError} = require('../errors');
const bcrypt = require('bcrypt');

const {JWT_SECRET, AUTH_TOKEN_TTL, COOKIE_NAME} = require('./config');
const {sign} = require('jsonwebtoken');

module.exports = async (req, res) => {
    const email = req.body.email;
    if(!email)
        throw new BadRequestError('Parameter \'email\' is missing');
    const password = req.body.password;
    if(!password)
        throw new BadRequestError('Parameter \'password\' is missing');

    const user = await req.blackrik.executeQuery('user', 'get', {email});

    if(!user || !await bcrypt.compare(password, user.password))
        throw new UnauthorizedError();

    const jwtOptions = {};
    AUTH_TOKEN_TTL && (jwtOptions.expiresIn = AUTH_TOKEN_TTL);
    const token = sign(user, JWT_SECRET, jwtOptions);

    res.cookie(COOKIE_NAME, token, {
        maxAge: AUTH_TOKEN_TTL
    });
    res.end();
};
