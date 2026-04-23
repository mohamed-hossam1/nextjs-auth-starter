import {
  ActionError,
  DatabaseError,
  InternalServerError,
  NotFoundError,
  ValidationError,
} from "./errors";

import type { ActionFailure } from "./types";

export function isActionError(error: unknown): error is ActionError {
  return error instanceof ActionError;
}

function isDatabaseError(error: unknown): error is {
  code?: string;
  message?: string;
} {
  return typeof error === "object" && error !== null && "code" in error;
}

export function normalizeError(error: unknown): ActionError {
  if (isActionError(error)) {
    return error;
  }
  if (isDatabaseError(error)) {
    const code = String(error.code);

    if (code === "23505") {
      return new ValidationError({
        message: "This value already exists",

        cause: error,
      });
    }

    if (code === "23503") {
      return new ValidationError({
        message: "Invalid reference",

        cause: error,
      });
    }

    if (code === "23502") {
      return new ValidationError({
        message: "Missing required field",

        cause: error,
      });
    }

    if (error.message?.includes("No rows")) {
      return new NotFoundError("Resource not found", error);
    }

    return new DatabaseError(undefined, error);
  }

  if (error instanceof Error) {
    return new InternalServerError(undefined, error);
  }

  return new InternalServerError();
}

export function createErrorResponse(error: unknown): ActionFailure {
  const normalizedError = normalizeError(error);

  return {
    success: false,

    error: {
      code: normalizedError.code,

      message: normalizedError.expose
        ? normalizedError.message
        : "Something went wrong",

      ...(normalizedError instanceof ValidationError &&
        normalizedError.fields && {
          fields: normalizedError.fields,
        }),
    },
  };
}
