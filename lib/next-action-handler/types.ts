import type { ErrorCode } from "./error/errors";

export type NormalizedError = {
  code: ErrorCode;
  message: string;
  expose: boolean;
  suppressActionLog?: boolean;
  cause?: unknown;
  stack?: string;
};
