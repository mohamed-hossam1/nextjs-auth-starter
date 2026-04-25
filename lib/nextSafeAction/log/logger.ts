import { ERROR_LOG_LEVEL } from "./logger-config";
import type { NormalizedError } from "../types";

type LogLevel = "info" | "warn" | "error";

type BaseLogOptions = {
  action: string;
  meta?: Record<string, unknown>;
};

type ActionExecutionLogOptions = BaseLogOptions & {
  duration: number;
  message?: string;
};

type ActionErrorLogOptions = BaseLogOptions & {
  error: NormalizedError;
};

function createLog({
  level,
  action,
  message,
  duration,
  meta,
}: {
  level: LogLevel;
  action: string;
  message: string;
  duration?: number;
  meta?: Record<string, unknown>;
}) {
  return {
    timestamp: new Date().toISOString(),
    level,
    action,
    message,
    ...(duration !== undefined && { duration }),
    ...(meta && { meta }),
  };
}

export function logActionExecution({
  action,
  duration,
  message = "Action executed successfully",
}: ActionExecutionLogOptions) {
  const log = createLog({
    level: "info",
    action,
    message,
    duration,
  });
  console.info(log);
}

export function logActionError({ action, error }: ActionErrorLogOptions) {
  if (error.code === "VALIDATION_ERROR") {
    return;
  }

  const level = ERROR_LOG_LEVEL[error.code];

  const log = createLog({
    level,
    action,
    message: error.message,
    meta: {
      errorCode: error.code,
      stack: error.stack,
      cause: error.cause,
    },
  });

  if (level === "error") {
    console.error(log);
    return;
  }

  console.warn(log);
}
