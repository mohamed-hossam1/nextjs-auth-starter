import { isAPIError } from "better-auth/api";

import {
  ActionError,
  InternalServerError,
} from "./errors";

type BetterAuthApiError = {
  message?: string;
  statusCode?: number;
};

type BetterAuthErrorOptions = {
  genericMessage?: string;
  suppressExpectedActionLog?: boolean;
};

export function fromBetterAuthError(
  error: unknown,
  options: BetterAuthErrorOptions = {},
): ActionError {
  if (!isAPIError(error)) {
    return new InternalServerError(
      options.genericMessage ?? "Something went wrong",
      error,
    );
  }

  const apiError = error as BetterAuthApiError;

  const message =
    options.genericMessage ?? apiError.message ?? "Something went wrong";

  const suppressActionLog = options.suppressExpectedActionLog ?? true;

  switch (apiError.statusCode) {
    case 400:
      return new ActionError({
        code: "BAD_REQUEST",
        message,
        cause: error,
        suppressActionLog,
      });

    case 401:
      return new ActionError({
        code: "UNAUTHORIZED",
        message,
        cause: error,
        suppressActionLog,
      });

    default:
      return new InternalServerError(message, error);
  }
}

// use for catch better auth error

// throw fromBetterAuthError(
//     error,
//     {
//       genericMessage: "Invalid credentials",
//     },
//   );
