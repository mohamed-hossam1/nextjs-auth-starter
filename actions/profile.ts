"use server";

import { headers } from "next/headers";
import { isAPIError } from "better-auth/api";
import { z } from "zod";

import { ROUTES } from "@/constants/routes";
import { auth } from "@/lib/auth";
import {
  type AuthenticatedContext,
  type PublicSession,
  requireSession,
  toPublicSession,
  toPublicUser,
} from "@/lib/auth-helpers";
import { handleAction } from "@/lib/handleErrors/action-handler";
import { AppError } from "@/lib/handleErrors/error";
import { zodValidate } from "@/lib/handleErrors/zod-validate";
import {
  ChangePasswordSchema,
  UpdateProfileSchema,
} from "@/lib/schema/profile-schema";

type ApiErrorLike = { message?: string; statusCode?: number };

function mapApiError(error: unknown, context: string): AppError {
  if (isAPIError(error)) {
    const apiError = error as unknown as ApiErrorLike;
    return new AppError(
      apiError.message ?? "Request failed",
      apiError.statusCode ?? 400,
    );
  }
  console.error(`[profile:${context}] internal error:`, error);
  return new AppError("Something went wrong", 500);
}

export async function updateProfile(
  formData: z.infer<typeof UpdateProfileSchema>,
) {
  return handleAction(async () => {
    await requireSession();
    const validated = zodValidate(UpdateProfileSchema, formData);
    try {
      return await auth.api.updateUser({
        headers: await headers(),
        body: { name: validated.name },
      });
    } catch (error) {
      throw mapApiError(error, "updateProfile");
    }
  });
}

export async function hasPassword() {
  return handleAction(async () => {
    await requireSession();
    try {
      const accounts = await auth.api.listUserAccounts({
        headers: await headers(),
      });
      return accounts.some((a) => a.providerId === "credential");
    } catch (error) {
      throw mapApiError(error, "hasPassword");
    }
  });
}

export async function sendCurrentUserPasswordResetEmail() {
  return handleAction(async () => {
    const { user } = await requireSession();
    try {
      return await auth.api.requestPasswordReset({
        body: {
          email: user.email,
          redirectTo: `${ROUTES.RESETPASSWORD}?type=reset`,
        },
      });
    } catch (error) {
      console.warn(
        "[profile:sendCurrentUserPasswordResetEmail] suppressed:",
        (error as ApiErrorLike).message,
      );
      return { message: "If your account is valid, a reset email was sent." };
    }
  });
}

export async function changePassword(
  formData: z.infer<typeof ChangePasswordSchema>,
) {
  return handleAction(async () => {
    await requireSession();
    const validated = zodValidate(ChangePasswordSchema, formData);
    try {
      return await auth.api.changePassword({
        headers: await headers(),
        body: {
          newPassword: validated.newPassword,
          currentPassword: validated.currentPassword,
        },
      });
    } catch (error) {
      throw mapApiError(error, "changePassword");
    }
  });
}

export async function listSessionsPublic() {
  return handleAction<PublicSession[]>(async () => {
    await requireSession();
    try {
      const sessions = await auth.api.listSessions({
        headers: await headers(),
      });
      return sessions.map((s) => toPublicSession(s));
    } catch (error) {
      throw mapApiError(error, "listSessionsPublic");
    }
  });
}

export async function getCurrentSession() {
  return handleAction<AuthenticatedContext | null>(async () => {
    try {
      const result = await auth.api.getSession({ headers: await headers() });
      if (!result?.session || !result.user) return null;
      return {
        session: toPublicSession(result.session),
        user: toPublicUser(result.user),
      };
    } catch (error) {
      throw mapApiError(error, "getCurrentSession");
    }
  });
}

export async function revokeSessionById(sessionId: string) {
  return handleAction(async () => {
    await requireSession();
    if (!sessionId || typeof sessionId !== "string") {
      throw new AppError("Invalid session id", 400);
    }
    try {
      const sessions = await auth.api.listSessions({
        headers: await headers(),
      });
      const target = sessions.find((s) => s.id === sessionId);
      if (!target) {
        throw new AppError("Session not found", 404);
      }
      return await auth.api.revokeSession({
        headers: await headers(),
        body: { token: target.token },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw mapApiError(error, "revokeSessionById");
    }
  });
}
