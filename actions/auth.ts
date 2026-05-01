// TODO: Handle validation error in UI
"use server";

import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { ROUTES } from "@/constants/routes";
import { db } from "@/db";
import { user as userTable } from "@/db/schema/auth-schema";
import { auth } from "@/lib/auth/auth";
import { actionClient, authedActionClient } from "@/lib/next-action-handler/safe-action";

import {
  BadRequestError,
  InternalServerError,
} from "@/lib/next-action-handler/error/errors";

import { fromBetterAuthError } from "@/lib/next-action-handler/error/better-auth-error";
import { logError } from "@/lib/next-action-handler/log/logger";

import { isValidateEmail } from "@/lib/auth/email-validation";
import {
  ForgotPasswordSchema,
  LoginSchema,
  RegisterSchema,
  ResetPasswordSchema,
  SafeAccountSchema,
} from "@/lib/zodSchema/auth-schema";

const GENERIC_AUTH_ERROR = "Invalid email or password.";

export const register = actionClient
  .metadata({ actionName: "auth.register" })
  .inputSchema(RegisterSchema)
  .action(async ({ parsedInput }) => {
    const emailError = await isValidateEmail(parsedInput.email);

    if (emailError) {
      throw new BadRequestError(emailError);
    }

    const existingUser = await db.query.user.findFirst({
      where: eq(userTable.email, parsedInput.email),

      columns: {
        id: true,
        emailVerified: true,
      },
    });

    if (existingUser?.emailVerified) {
      throw new BadRequestError(
        "An account with this email already exists. Please sign in instead.",
      );
    }

    try {
      return await auth.api.signUpEmail({
        headers: await headers(),

        body: {
          name: parsedInput.name,
          email: parsedInput.email,
          password: parsedInput.password,
          callbackURL: ROUTES.DASHBOARD,
        },
      });
    } catch (error) {
      if (error instanceof Error && /already/i.test(error.message)) {
        throw new BadRequestError(
          "An account with this email already exists. Please sign in instead.",
          error,
        );
      }

      throw fromBetterAuthError(error, {
        genericMessage: GENERIC_AUTH_ERROR,
      });
    }
  });

export const login = actionClient
  .metadata({ actionName: "auth.login" })
  .inputSchema(LoginSchema)
  .action(async ({ parsedInput }) => {
    try {
      return await auth.api.signInEmail({
        headers: await headers(),
        body: {
          email: parsedInput.email,
          password: parsedInput.password,
          callbackURL: ROUTES.DASHBOARD,
        },
      });
    } catch (error) {
      throw fromBetterAuthError(error, {
        genericMessage: GENERIC_AUTH_ERROR,
      });
    }
  });

export const signInWithGoogle = actionClient
  .metadata({ actionName: "auth.signInWithGoogle" })
  .action(async () => {
    try {
      return await auth.api.signInSocial({
        headers: await headers(),
        body: {
          provider: "google",
          callbackURL: ROUTES.DASHBOARD,
        },
      });
    } catch (error) {
      throw fromBetterAuthError(error, {
        genericMessage: GENERIC_AUTH_ERROR,
      });
    }
  });

export const signInWithGithub = actionClient
  .metadata({ actionName: "auth.signInWithGithub" })
  .action(async () => {
    try {
      return await auth.api.signInSocial({
        headers: await headers(),
        body: {
          provider: "github",
          callbackURL: ROUTES.DASHBOARD,
        },
      });
    } catch (error) {
      throw fromBetterAuthError(error, {
        genericMessage: GENERIC_AUTH_ERROR,
      });
    }
  });

export const listUserAccounts = authedActionClient
  .metadata({ actionName: "auth.listUserAccounts" })
  .outputSchema(z.array(SafeAccountSchema))
  .action(async () => {
    try {
      const accounts = await auth.api.listUserAccounts({
        headers: await headers(),
      });

      return accounts.map((acc) => ({
        id: acc.id,
        providerId: acc.providerId,
        createdAt: acc.createdAt.toISOString(),
        updatedAt: acc.updatedAt.toISOString(),
      }));
    } catch (error) {
      throw fromBetterAuthError(error, {
        genericMessage: "Failed to load linked accounts.",
      });
    }
  });

export const unLinkAccount = authedActionClient
  .metadata({ actionName: "auth.unlinkAccount" })
  .inputSchema(z.object({ providerId: z.string() }))
  .action(async ({ parsedInput }) => {
    const userAccounts = await auth.api.listUserAccounts({
      headers: await headers(),
    });

    const remainingAccounts = userAccounts.filter(
      (account) => account.providerId !== parsedInput.providerId,
    );

    if (remainingAccounts.length === 0) {
      throw new BadRequestError(
        "Cannot disconnect the last remaining sign-in method. You must set up another sign-in method first.",
      );
    }

    try {
      return await auth.api.unlinkAccount({
        headers: await headers(),
        body: {
          providerId: parsedInput.providerId,
        },
      });
    } catch (error) {
      throw fromBetterAuthError(error, {
        suppressExpectedActionLog: false,
      });
    }
  });

export const linkAccount = authedActionClient
  .metadata({ actionName: "auth.linkAccount" })
  .inputSchema(z.object({ provider: z.string() }))
  .action(async ({ parsedInput }) => {
    try {
      return await auth.api.linkSocialAccount({
        headers: await headers(),
        body: {
          provider: parsedInput.provider,
          callbackURL: `${ROUTES.DASHBOARD}?open=links`,
          errorCallbackURL: `${ROUTES.DASHBOARD}?open=links`,
        },
      });
    } catch (error) {
      throw fromBetterAuthError(error, {
        genericMessage: "Failed to link account.",
      });
    }
  });

export const forgotPassword = actionClient
  .metadata({
    actionName: "auth.forgotPassword",
    suppressSuccessLog: true,
  })
  .inputSchema(ForgotPasswordSchema)
  .action(async ({ parsedInput }) => {
    const existingUser = await db.query.user.findFirst({
      where: eq(userTable.email, parsedInput.email),
      columns: {
        id: true,
      },
    });

    const forgotPasswordResponse = {
      message:
        "If an account exists for this email, a password reset link has been sent.",
    };

    if (!existingUser) {
      logError({
        action: "auth.forgotPassword",
        message: "Reset Password: User not found",
        meta: { email: parsedInput.email },
      });

      return forgotPasswordResponse;
    }

    try {
      await auth.api.requestPasswordReset({
        body: {
          email: parsedInput.email,
          redirectTo: `${ROUTES.RESETPASSWORD}?type=forgot`,
        },
      });
    } catch {
      /**
       * Prevent email enumeration.
       * Always return a success response.
       */
    }

    return forgotPasswordResponse;
  });

const ResetPasswordInputSchema = ResetPasswordSchema.extend({
  token: z.string().min(1, {
    message: "Invalid or expired reset link.",
  }),
});

export const resetPassword = actionClient
  .metadata({ actionName: "auth.resetPassword" })
  .inputSchema(ResetPasswordInputSchema)
  .action(async ({ parsedInput }) => {
    try {
      return await auth.api.resetPassword({
        body: {
          newPassword: parsedInput.password,
          token: parsedInput.token,
        },
      });
    } catch (error) {
      throw fromBetterAuthError(error, {
        genericMessage: "Invalid or expired reset link.",
      });
    }
  });

const ResendVerificationSchema = z.object({
  email: z
    .string()
    .min(1, {
      message: "Email is required.",
    })
    .email({
      message: "Please provide a valid email address.",
    })
    .transform((value) => value.trim().toLowerCase()),
});

export const resendVerification = actionClient
  .metadata({
    actionName: "auth.resendVerification",
    suppressSuccessLog: true,
  })
  .inputSchema(ResendVerificationSchema)
  .action(async ({ parsedInput }) => {
    try {
      await auth.api.sendVerificationEmail({
        headers: await headers(),

        body: {
          email: parsedInput.email,
          callbackURL: ROUTES.DASHBOARD,
        },
      });
    } catch {
      /**
       * Prevent email enumeration.
       * Always return a success response.
       */
    }

    return {
      message:
        "If your email needs verification, a new verification link has been sent.",
    };
  });

export const signOut = actionClient
  .metadata({ actionName: "auth.signOut" })
  .action(async () => {
    try {
      return await auth.api.signOut({
        headers: await headers(),
      });
    } catch (error) {
      throw new InternalServerError("Failed to sign out", error);
    }
  });
