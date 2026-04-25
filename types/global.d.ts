import type { ErrorCode } from "@/lib/nextSafeAction/error/errors";

export type ActionServerError = {
  code: ErrorCode;
  message: string;
};

export type { InferSafeActionFnResult as ActionResult } from "next-safe-action";
