import { ERROR_LOG_LEVEL, logger } from "./logger-config";
import { ActionError } from "../error/errors";
import type { NormalizedError } from "../types";

type BaseLogOptions = {
  action: string;
};

type LogMeta = Record<string, unknown>;

type ActionLogMessageOptions = BaseLogOptions & {
  message: string;
  meta?: LogMeta;
};

type ActionExecutionLogOptions = BaseLogOptions & {
  durationMs?: number;
  message?: string;
  meta?: LogMeta;
};

type ActionErrorLogOptions = BaseLogOptions & {
  error: NormalizedError;
};

function buildCauseMeta(
  cause: NormalizedError["cause"],
  isDevelopment: boolean,
) {
  if (cause instanceof Error) {
    const isSafeCauseMessage =
      cause instanceof ActionError ? cause.expose : false;

    return {
      name: cause.name,
      message: isDevelopment || isSafeCauseMessage ? cause.message : undefined,
      stack: isDevelopment ? cause.stack : undefined,
    };
  }

  if (isDevelopment) {
    return cause;
  }

  return undefined;
}

function formatMessage({
  action,
  message,
  errorCode,
  durationMs,
}: {
  action: string;
  message: string;
  errorCode?: string;
  durationMs?: number;
}) {
  const actionLabel = action ? `[${action}] ` : "";
  const errorLabel = errorCode ? `${errorCode} ` : "";
  const durationLabel =
    typeof durationMs === "number" ? ` (${durationMs}ms)` : "";

  return `${actionLabel}${errorLabel}${message}${durationLabel}`.trim();
}

export function logWarn({ action, message, meta }: ActionLogMessageOptions) {
  logger.warn(
    {
      action,
      ...meta,
    },
    formatMessage({ action, message }),
  );
}

export function logError({ action, message, meta }: ActionLogMessageOptions) {
  logger.error(
    {
      action,
      ...meta,
    },
    formatMessage({ action, message }),
  );
}

export function logInfo({
  action,
  message = "",
  durationMs,
  meta,
}: ActionExecutionLogOptions) {
  logger.info(
    {
      action,
      durationMs,
      ...meta,
    },
    formatMessage({ action, message, durationMs }),
  );
}

export function logActionExecution({
  action,
  durationMs,
  message = "Action executed successfully",
  meta,
}: ActionExecutionLogOptions) {
  logInfo({
    action,
    durationMs,
    message,
    meta,
  });
}

export function logActionError({ action, error }: ActionErrorLogOptions) {
  const level = ERROR_LOG_LEVEL[error.code];
  const isDevelopment = process.env.NODE_ENV === "development";

  const cause = isDevelopment
    ? buildCauseMeta(error.cause, isDevelopment)
    : undefined;

  const logMeta = {
    errorCode: error.code,
    ...(isDevelopment ? { stack: error.stack, cause } : {}),
  };

  const payload = {
    action,
    ...logMeta,
  };

  const message = formatMessage({
    action,
    message: error.message,
    errorCode: error.code,
  });

  if (level === "error") {
    logger.error(payload, message);
    return;
  }

  logger.warn(payload, message);
}
