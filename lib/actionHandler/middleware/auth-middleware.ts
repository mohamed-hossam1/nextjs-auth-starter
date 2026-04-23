import { UnauthorizedError } from "../errors";

import type { ActionMiddleware } from "../types";

export const authMiddleware: ActionMiddleware = async ({ ctx }) => {
  if (!ctx.user) {
    throw new UnauthorizedError();
  }
};
