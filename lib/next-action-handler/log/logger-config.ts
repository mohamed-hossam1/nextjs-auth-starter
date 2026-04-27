import pino from "pino";
import pretty from "pino-pretty";
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

const logPrettyEnv = process.env.LOG_PRETTY?.toLowerCase();
const isDevelopment = process.env.NODE_ENV === "development";
const usePretty =
  logPrettyEnv === "true" ||
  logPrettyEnv === "1" ||
  (isDevelopment && logPrettyEnv !== "false") ||
  (typeof process !== "undefined" && process.stdout?.isTTY && logPrettyEnv !== "false");

const baseOptions: pino.LoggerOptions = {
  base: null,
  level: process.env.LOG_LEVEL ?? "info",
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
  },
};

const prettyStream = usePretty
  ? pretty({
      colorize: true,
      translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
      singleLine: true,
      levelFirst: false,
      ignore: "pid,hostname,action,durationMs,errorCode,source",
      sync: true,
    })
  : undefined;

export const logger = prettyStream
  ? pino(baseOptions, prettyStream)
  : pino(baseOptions);
