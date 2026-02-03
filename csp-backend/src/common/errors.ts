export interface ErrorResponse {
  status: number;
  title: string;
  detail?: string;
  code?: string;
}
// Base error class
export class BaseError extends Error {
  status: number;
  title: string;
  detail?: string;
  code?: string;

  constructor(status: number, title: string, detail?: string, code?: string) {
    super(title);
    this.status = status;
    this.title = title;
    this.detail = detail;
    this.code = code;
    
    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): ErrorResponse {
    return {
      status: this.status,
      title: this.title,
      ...(this.detail && { detail: this.detail }),
      ...(this.code && { code: this.code })
    };
  }
}

export class BadRequestError extends BaseError {
  constructor(title: string = 'Bad Request', detail?: string, code?: string) {
    super(400, title, detail, code);
  }
}

export class UnauthorizedError extends BaseError {
  constructor(title: string = 'Unauthorized', detail?: string, code?: string) {
    super(401, title, detail, code);
  }
}

export class ForbiddenError extends BaseError {
  constructor(title: string = 'Forbidden', detail?: string, code?: string) {
    super(403, title, detail, code);
  }
}

export class NotFoundError extends BaseError {
  constructor(title: string = 'Not Found', detail?: string, code?: string) {
    super(404, title, detail, code);
  }
}

export class ConflictError extends BaseError {
  constructor(title: string = 'Conflict', detail?: string, code?: string) {
    super(409, title, detail, code);
  }
}

export class InternalServerError extends BaseError {
  constructor(title: string = 'Internal Server Error', detail?: string, code?: string) {
    super(500, title, detail, code);
  }
}
