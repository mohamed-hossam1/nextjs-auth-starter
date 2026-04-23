import { isAPIError } from "better-auth/api";

import { ActionError, BadRequestError, InternalServerError } from "./errors";

type ApiErrorLike = { message?: string; statusCode?: number; status?: string };

export function betterAuthError(
  error: unknown,
  context: string,
  options: { enumerationSafe?: boolean; genericMessage?: string } = {},
): ActionError {
  if (error instanceof ActionError) return error;

  const { enumerationSafe = false, genericMessage = "Something went wrong" } =
    options;

  if (isAPIError(error)) {
    const apiError = error as unknown as ApiErrorLike;
    const status = apiError.statusCode ?? 400;

    if (enumerationSafe) {
      console.warn(`[${context}]`, apiError.message ?? apiError.status);
      return status >= 500
        ? new InternalServerError(genericMessage, error)
        : new BadRequestError(genericMessage, error);
    }

    return status >= 500
      ? new InternalServerError(apiError.message ?? genericMessage, error)
      : new BadRequestError(apiError.message ?? genericMessage, error);
  }

  console.error(`[${context}] internal error:`, error);
  return new InternalServerError(genericMessage, error);
}
