import { ActionError } from "./errors";

type LogLevel = "info" | "warn" | "error";

type LogMeta = Record<string, unknown>;

type LogPayload = {
  level: LogLevel;
  action: string;
  message: string;
  meta?: LogMeta;
};

function createLog({ level, action, message, meta }: LogPayload) {
  const timestamp = new Date().toISOString();
  return {
    timestamp,
    level,
    action,
    message,
    ...(meta && { meta }),
  };
}

export function logInfo({ action, message, meta }: Omit<LogPayload, "level">) {
  console.info(
    createLog({
      level: "info",
      action,
      message,
      meta,
    }),
  );
}

export function logWarn({ action, message, meta }: Omit<LogPayload, "level">) {
  console.warn(
    createLog({
      level: "warn",
      action,
      message,
      meta,
    }),
  );
}

export function logError({ action, message, meta }: Omit<LogPayload, "level">) {
  console.error(
    createLog({
      level: "error",
      action,
      message,
      meta,
    }),
  );
}

export async function withTiming<T>({
  action,
  fn,
}: {
  action: string;

  fn: () => Promise<T>;
}): Promise<T> {
  const start = performance.now();

  try {
    logInfo({
      action,
      message: "started",
    });

    const result = await fn();
    const duration = Number((performance.now() - start).toFixed(2));

    logInfo({
      action,
      message: "completed",
      meta: {
        duration,
      },
    });

    return result;
  } catch (error) {
    const duration = Number((performance.now() - start).toFixed(2));

    logError({
      action,
      message: "failed",
      meta: {
        duration,
        error:
          error instanceof ActionError
            ? {
                name: error.name,
                message: error.message,
                stack:
                  process.env.NODE_ENV === "development"
                    ? error.stack
                    : undefined,
              }
            : error,
      },
    });

    throw error;
  }
}
