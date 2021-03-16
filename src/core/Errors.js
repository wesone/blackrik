class BaseError extends Error
{
    constructor(message = 'Internal Error')
    {
        super(message);
    }
}
  
class BadRequestError extends BaseError
{
    constructor(message = 'Bad Request')
    {
        super(message);
        this.code = 400;
    }
}
  
class UnauthorizedError extends BaseError
{
    constructor(message = 'Unauthorized')
    {
        super(message);
        this.code = 401;
    }
}
  
class ForbiddenError extends BaseError
{
    constructor(message = 'Forbidden')
    {
        super(message);
        this.code = 403;
    }
}

class NotFoundError extends BaseError
{
    constructor(message = 'Not Found')
    {
        super(message);
        this.code = 404;
    }
}

module.exports.BaseError = BaseError;
module.exports.BadRequestError = BadRequestError;
module.exports.UnauthorizedError = UnauthorizedError;
module.exports.ForbiddenError = ForbiddenError;
module.exports.NotFoundError = NotFoundError;
