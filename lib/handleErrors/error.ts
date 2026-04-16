export class AppError extends Error {
  errors?: Record<string, string[]>;

  constructor(
    message: string,
    public statusCode: number = 400,
    errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "AppError";
    this.errors = errors;
  }
}

export class ValidationError extends AppError {
  constructor(fieldErrors: Record<string, string[]>) {
    const message = ValidationError.formatFieldErrors(fieldErrors);
    super(message, 422, fieldErrors);
    this.name = "ValidationError";
  }

  static formatFieldErrors(errors: Record<string, string[]>): string {
    return Object.entries(errors)
      .map(([field, messages]) => {
        const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
        return messages[0] === "Required"
          ? `${fieldName} is required`
          : messages.join(" and ");
      })
      .join(", ");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401);
    this.name = "UnauthorizedError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404);
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403);
    this.name = "ForbiddenError";
  }
}

export class DataBaseError extends AppError {
  constructor(message = "DataBase") {
    super(message, 500);
    this.name = "DataBaseError";
  }
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}