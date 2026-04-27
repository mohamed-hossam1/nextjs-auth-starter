"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { ROUTES } from "@/constants/routes";

import { auth } from "@/lib/auth";

import {
  type PublicSession,
  getSession,
  requireSession,
  toPublicSession,
} from "@/lib/auth-helpers";

import {
  actionClient,
  authedActionClient,
} from "@/lib/next-action-handler/safe-action";

import { fromBetterAuthError } from "@/lib/next-action-handler/error/better-auth-error";

import { NotFoundError } from "@/lib/next-action-handler/error/errors";

import {
  ChangePasswordSchema,
  UpdateProfileSchema,
} from "@/lib/zodSchema/profile-schema";

export const getCurrentSession = actionClient
  .metadata({
    actionName: "profile:getCurrentSession",
  })
  .action(() => getSession());

export const updateProfile = authedActionClient
  .metadata({
    actionName: "profile:updateProfile",
  })
  .inputSchema(UpdateProfileSchema)
  .action(async ({ parsedInput }) => {
    try {
      return await auth.api.updateUser({
        headers: await headers(),

        body: {
          name: parsedInput.name,
        },
      });
    } catch (error) {
      throw fromBetterAuthError(error);
    }
  });

export const hasPassword = authedActionClient
  .metadata({
    actionName: "profile:hasPassword",
  })
  .action(async () => {
    try {
      const accounts = await auth.api.listUserAccounts({
        headers: await headers(),
      });

      return accounts.some((account) => account.providerId === "credential");
    } catch (error) {
      throw fromBetterAuthError(error);
    }
  });

export const sendCurrentUserPasswordResetEmail = authedActionClient
  .metadata({
    actionName: "profile:sendCurrentUserPasswordResetEmail",
  })
  .action(async () => {
    const { user } = await requireSession();

    try {
      await auth.api.requestPasswordReset({
        body: {
          email: user.email,
          redirectTo: `${ROUTES.RESETPASSWORD}?type=reset`,
        },
      });
    } catch {
      /**
       * Prevent email enumeration.
       * Always return a success response.
       */
    }

    return {
      message: "If your account is valid, a reset email was sent.",
    };
  });

export const changePassword = authedActionClient
  .metadata({
    actionName: "profile:changePassword",
  })
  .inputSchema(ChangePasswordSchema)
  .action(async ({ parsedInput }) => {
    try {
      return await auth.api.changePassword({
        headers: await headers(),

        body: {
          newPassword: parsedInput.newPassword,
          currentPassword: parsedInput.currentPassword,
        },
      });
    } catch (error) {
      throw fromBetterAuthError(error);
    }
  });

export const listSessionsPublic = authedActionClient
  .metadata({
    actionName: "profile:listSessionsPublic",
  })
  .action(async (): Promise<PublicSession[]> => {
    try {
      const sessions = await auth.api.listSessions({
        headers: await headers(),
      });

      return sessions.map(toPublicSession);
    } catch (error) {
      throw fromBetterAuthError(error);
    }
  });

export const revokeSessionById = authedActionClient
  .metadata({
    actionName: "profile:revokeSessionById",
  })
  .inputSchema(
    z.object({
      sessionId: z.string().min(1, {
        message: "Invalid session id",
      }),
    }),
  )
  .action(async ({ parsedInput }) => {
    try {
      const sessions = await auth.api.listSessions({
        headers: await headers(),
      });

      const targetSession = sessions.find(
        (session) => session.id === parsedInput.sessionId,
      );

      if (!targetSession) {
        throw new NotFoundError("Session not found");
      }

      return await auth.api.revokeSession({
        headers: await headers(),

        body: {
          token: targetSession.token,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      throw fromBetterAuthError(error);
    }
  });
