class BaseError extends Error
{
    constructor(message = 'Internal Error', status = 500)
    {
        super(message);
        this.status = status;
    }
}
module.exports.BaseError = BaseError;
  
class BadRequestError extends BaseError
{
    constructor(message = 'Bad Request')
    {
        super(message);
        this.status = 400;
    }
}
module.exports.BadRequestError = BadRequestError;
  
class UnauthorizedError extends BaseError
{
    constructor(message = 'Unauthorized')
    {
        super(message);
        this.status = 401;
    }
}
module.exports.UnauthorizedError = UnauthorizedError;
  
class ForbiddenError extends BaseError
{
    constructor(message = 'Forbidden')
    {
        super(message);
        this.status = 403;
    }
}
module.exports.ForbiddenError = ForbiddenError;

class NotFoundError extends BaseError
{
    constructor(message = 'Not Found')
    {
        super(message);
        this.status = 404;
    }
}
module.exports.NotFoundError = NotFoundError;

class ConflictError extends BaseError
{
    constructor(message = 'Conflict')
    {
        super(message);
        this.status = 409;
    }
}
module.exports.ConflictError = ConflictError;
