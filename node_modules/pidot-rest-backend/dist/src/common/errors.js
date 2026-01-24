export class BaseError extends Error {
    constructor(status, title, detail, code) {
        super(title);
        this.status = status;
        this.title = title;
        this.detail = detail;
        this.code = code;
        // Maintains proper stack trace for where error was thrown
        Error.captureStackTrace(this, this.constructor);
    }
    toJSON() {
        return Object.assign(Object.assign({ status: this.status, title: this.title }, (this.detail && { detail: this.detail })), (this.code && { code: this.code }));
    }
}
export class BadRequestError extends BaseError {
    constructor(title = 'Bad Request', detail, code) {
        super(400, title, detail, code);
    }
}
export class UnauthorizedError extends BaseError {
    constructor(title = 'Unauthorized', detail, code) {
        super(401, title, detail, code);
    }
}
export class ForbiddenError extends BaseError {
    constructor(title = 'Forbidden', detail, code) {
        super(403, title, detail, code);
    }
}
export class NotFoundError extends BaseError {
    constructor(title = 'Not Found', detail, code) {
        super(404, title, detail, code);
    }
}
export class ConflictError extends BaseError {
    constructor(title = 'Conflict', detail, code) {
        super(409, title, detail, code);
    }
}
export class InternalServerError extends BaseError {
    constructor(title = 'Internal Server Error', detail, code) {
        super(500, title, detail, code);
    }
}
