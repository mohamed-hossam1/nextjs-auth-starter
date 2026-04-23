"use server";

import { headers } from "next/headers";
import { betterAuthError } from "@/lib/actionHandler/better-auth-error";
import { logWarn } from "@/lib/actionHandler/logger";
import { z } from "zod";

import { ROUTES } from "@/constants/routes";
import { auth } from "@/lib/auth";
import {
  type AuthenticatedContext,
  type PublicSession,
  getSession,
  requireSession,
  toPublicSession,
} from "@/lib/auth-helpers";
import { protectedAction, publicAction } from "@/lib/actionHandler/create-action";
import { NotFoundError } from "@/lib/actionHandler/errors";
import {
  ChangePasswordSchema,
  UpdateProfileSchema,
} from "@/lib/schema/profile-schema";

export const updateProfile = protectedAction({
  name: "profile.updateProfile",
  input: UpdateProfileSchema,
}).action(async ({ input }) => {
  try {
    return await auth.api.updateUser({
      headers: await headers(),
      body: { name: input.name },
    });
  } catch (error) {
    throw betterAuthError(error, "profile:updateProfile");
  }
});

export const hasPassword = protectedAction({
  name: "profile.hasPassword",
}).action(async () => {
  try {
    const accounts = await auth.api.listUserAccounts({
      headers: await headers(),
    });
    return accounts.some((a) => a.providerId === "credential");
  } catch (error) {
    throw betterAuthError(error, "profile:hasPassword");
  }
});

export const sendCurrentUserPasswordResetEmail = protectedAction({
  name: "profile.sendCurrentUserPasswordResetEmail",
  output: z.object({ message: z.string() }),
}).action(async () => {
  const { user } = await requireSession();

  try {
    await auth.api.requestPasswordReset({
      body: {
        email: user.email,
        redirectTo: `${ROUTES.RESETPASSWORD}?type=reset`,
      },
    });
  } catch (error) {
    logWarn({ action: "profile.sendCurrentUserPasswordResetEmail", message: "suppressed API error", meta: { error } });
  }

  return { message: "If your account is valid, a reset email was sent." };
});

export const changePassword = protectedAction({
  name: "profile.changePassword",
  input: ChangePasswordSchema,
}).action(async ({ input }) => {
  try {
    return await auth.api.changePassword({
      headers: await headers(),
      body: {
        newPassword: input.newPassword,
        currentPassword: input.currentPassword,
      },
    });
  } catch (error) {
    throw betterAuthError(error, "profile:changePassword");
  }
});

export const listSessionsPublic = protectedAction({
  name: "profile.listSessionsPublic",
}).action(async (): Promise<PublicSession[]> => {
  try {
    const sessions = await auth.api.listSessions({
      headers: await headers(),
    });
    return sessions.map((session) => toPublicSession(session));
  } catch (error) {
    throw betterAuthError(error, "profile:listSessionsPublic");
  }
});

export const getCurrentSession = publicAction({
  name: "profile.getCurrentSession",
}).action(async (): Promise<AuthenticatedContext | null> => {
  try {
    return await getSession();
  } catch (error) {
    throw betterAuthError(error, "profile:getCurrentSession");
  }
});

const RevokeSessionInputSchema = z.object({
  sessionId: z.string().min(1, { message: "Invalid session id" }),
});

export const revokeSessionById = protectedAction({
  name: "profile.revokeSessionById",
  input: RevokeSessionInputSchema,
}).action(async ({ input }) => {
  try {
    const sessions = await auth.api.listSessions({
      headers: await headers(),
    });
    const target = sessions.find((s) => s.id === input.sessionId);
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
