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
  authedActionClient,
  actionClient,
} from "@/lib/nextSafeAction/safe-action";
import { betterAuthError } from "@/lib/nextSafeAction/better-auth-error";
import { NotFoundError } from "@/lib/nextSafeAction/error/errors";
import { logWarn } from "@/lib/nextSafeAction/logger";
import {
  ChangePasswordSchema,
  UpdateProfileSchema,
} from "@/lib/schema/profile-schema";

export const getCurrentSession = actionClient
  .metadata({ actionName: "profile.getCurrentSession" })
  .action(() => getSession());

export const updateProfile = authedActionClient
  .metadata({ actionName: "profile.updateProfile" })
  .inputSchema(UpdateProfileSchema)
  .action(async ({ parsedInput }) => {
    try {
      return await auth.api.updateUser({
        headers: await headers(),
        body: { name: parsedInput.name },
      });
    } catch (error) {
      throw betterAuthError(error, "profile:updateProfile");
    }
  });

export const hasPassword = authedActionClient
  .metadata({ actionName: "profile.hasPassword" })
  .action(async () => {
    try {
      const accounts = await auth.api.listUserAccounts({
        headers: await headers(),
      });
      return accounts.some((a) => a.providerId === "credential");
    } catch (error) {
      throw betterAuthError(error, "profile:hasPassword");
    }
  });

export const sendCurrentUserPasswordResetEmail = authedActionClient
  .metadata({ actionName: "profile.sendCurrentUserPasswordResetEmail" })
  .action(async () => {
    const { user } = await requireSession();

    try {
      await auth.api.requestPasswordReset({
        body: {
          email: user.email,
          redirectTo: `${ROUTES.RESETPASSWORD}?type=reset`,
        },
      });
    } catch (error) {
      logWarn({
        action: "profile.sendCurrentUserPasswordResetEmail",
        message: "suppressed API error",
        meta: { error },
      });
    }

    return { message: "If your account is valid, a reset email was sent." };
  });

export const changePassword = authedActionClient
  .metadata({ actionName: "profile.changePassword" })
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
      throw betterAuthError(error, "profile:changePassword");
    }
  });

export const listSessionsPublic = authedActionClient
  .metadata({ actionName: "profile.listSessionsPublic" })
  .action(async (): Promise<PublicSession[]> => {
    try {
      const sessions = await auth.api.listSessions({
        headers: await headers(),
      });
      return sessions.map((session) => toPublicSession(session));
    } catch (error) {
      throw betterAuthError(error, "profile:listSessionsPublic");
    }
  });

export const revokeSessionById = authedActionClient
  .metadata({ actionName: "profile.revokeSessionById" })
  .inputSchema(
    z.object({
      sessionId: z.string().min(1, { message: "Invalid session id" }),
    }),
  )
  .action(async ({ parsedInput }) => {
    try {
      const sessions = await auth.api.listSessions({
        headers: await headers(),
      });
      const target = sessions.find((s) => s.id === parsedInput.sessionId);
      if (!target) {
        throw new NotFoundError("Session not found");
      }
      return await auth.api.revokeSession({
        headers: await headers(),
        body: { token: target.token },
      });
    } catch (error) {
      throw betterAuthError(error, "profile:revokeSessionById");
    }
  });
