import { ForbiddenError } from "../errors";

import type { ActionMiddleware, UserRole } from "../types";

export function roleMiddleware(roles: UserRole[]): ActionMiddleware {
  return async ({ ctx }) => {
    if (!ctx.user) {
      throw new ForbiddenError();
    }
    if (!roles.includes(ctx.user.role)) {
      throw new ForbiddenError();
    }
  };
}