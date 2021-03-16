class BaseError extends Error
{
    constructor(message = 'Internal Error')
    {
        super(message);
    }
}
module.exports.BaseError = BaseError;
  
class BadRequestError extends BaseError
{
    constructor(message = 'Bad Request')
    {
        super(message);
        this.code = 400;
    }
}
module.exports.BadRequestError = BadRequestError;
  
class UnauthorizedError extends BaseError
{
    constructor(message = 'Unauthorized')
    {
        super(message);
        this.code = 401;
    }
}
module.exports.UnauthorizedError = UnauthorizedError;
  
class ForbiddenError extends BaseError
{
    constructor(message = 'Forbidden')
    {
        super(message);
        this.code = 403;
    }
}
module.exports.ForbiddenError = ForbiddenError;

class NotFoundError extends BaseError
{
    constructor(message = 'Not Found')
    {
        super(message);
        this.code = 404;
    }
}
module.exports.NotFoundError = NotFoundError;
