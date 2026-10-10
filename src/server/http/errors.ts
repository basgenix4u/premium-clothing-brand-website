/** Application errors map 1:1 to RFC 9457 problem responses. Never put secrets in `detail`. */
export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly title: string,
    readonly detail?: string,
    readonly extensions?: Record<string, unknown>,
  ) {
    super(detail ?? title);
    this.name = "AppError";
  }
}

export class BadRequestError extends AppError {
  constructor(detail?: string) {
    super(400, "Bad request", detail);
  }
}

export class ValidationFailedError extends AppError {
  constructor(fieldErrors: Record<string, string[]>) {
    super(422, "Validation failed", "One or more fields are invalid.", { errors: fieldErrors });
  }
}

export class UnauthorizedError extends AppError {
  constructor(detail = "Sign in to continue.") {
    super(401, "Authentication required", detail);
  }
}

export class ForbiddenError extends AppError {
  constructor(detail = "You do not have permission to do this.") {
    super(403, "Forbidden", detail);
  }
}

export class NotFoundError extends AppError {
  constructor(detail = "The requested resource was not found.") {
    super(404, "Not found", detail);
  }
}

export class ConflictError extends AppError {
  constructor(detail: string) {
    super(409, "Conflict", detail);
  }
}

export class UnprocessableError extends AppError {
  constructor(detail: string) {
    super(422, "Unprocessable request", detail);
  }
}

export class RateLimitedError extends AppError {
  constructor(readonly retryAfterSeconds: number) {
    super(429, "Too many requests", "Please wait before trying again.", {
      retryAfterSeconds,
    });
  }
}
