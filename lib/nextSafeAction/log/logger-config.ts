import type { ErrorCode } from "../error/errors";

export const ERROR_LOG_LEVEL: Record<ErrorCode, "warn" | "error"> = {
  BAD_REQUEST: "warn",
  VALIDATION_ERROR: "warn",
  UNAUTHORIZED: "warn",
  FORBIDDEN: "warn",
  NOT_FOUND: "warn",
  RATE_LIMITED: "warn",

  DATABASE_ERROR: "error",
  INTERNAL_SERVER_ERROR: "error",
};
