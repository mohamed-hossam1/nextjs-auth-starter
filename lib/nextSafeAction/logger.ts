import { logActionError, logActionExecution } from "./log/logger";
import { ERROR_LOG_LEVEL } from "./log/logger-config";

export { logActionError, logActionExecution };

type LogLevel = "info" | "warn" | "error";

type BaseLogOptions = {
  action: string;
  meta?: Record<string, unknown>;
};

type ActionLogMessageOptions = BaseLogOptions & {
  message: string;
};

function createLog({
  level,
  action,
  message,
  meta,
}: {
  level: LogLevel;
  action: string;
  message: string;
  meta?: Record<string, unknown>;
}) {
  return {
    timestamp: new Date().toISOString(),
    level,
    action,
    message,
    ...(meta && { meta }),
  };
}

export function logWarn({
  action,
  message,
  meta,
}: ActionLogMessageOptions) {
  const log = createLog({
    level: "warn",
    action,
    message,
    meta,
  });
  console.warn(log);
}

export function logError({
  action,
  message,
  meta,
}: ActionLogMessageOptions) {
  const log = createLog({
    level: "error",
    action,
    message,
    meta,
  });
  console.error(log);
}

export function logInfo({
  action,
  message,
  meta,
}: ActionLogMessageOptions) {
  const log = createLog({
    level: "info",
    action,
    message,
    meta,
  });
  console.info(log);
}
