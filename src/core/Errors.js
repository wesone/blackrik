module.exports.BaseError = class BaseError extends Error
{
    constructor(message = 'Internal Error')
    {
        super(message);
    }
}
  
module.exports.BadRequestError = class BadRequestError extends BaseError
{
    constructor(message = 'Bad Request')
    {
        super(message);
        this.code = 400;
    }
}
  
module.exports.UnauthorizedError = class UnauthorizedError extends BaseError
{
    constructor(message = 'Unauthorized')
    {
        super(message);
        this.code = 401;
    }
}
  
module.exports.ForbiddenError = class ForbiddenError extends BaseError
{
    constructor(message = 'Forbidden')
    {
        super(message);
        this.code = 403;
    }
}

module.exports.NotFoundError = class NotFoundError extends BaseError
{
    constructor(message = 'Not Found')
    {
        super(message);
        this.code = 404;
    }
}
