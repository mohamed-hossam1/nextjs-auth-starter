// TODO: Handle validation error in UI
"use server";

import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { ROUTES } from "@/constants/routes";
import { db } from "@/db";
import { user as userTable } from "@/db/schema/auth-schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-action-handler/safe-action";

import {
  BadRequestError,
  InternalServerError,
} from "@/lib/next-action-handler/error/errors";

import { fromBetterAuthError } from "@/lib/next-action-handler/error/better-auth-error";

import { isValidateEmail } from "@/lib/email-validation";
import {
  ForgotPasswordSchema,
  LoginSchema,
  RegisterSchema,
  ResetPasswordSchema,
} from "@/lib/zodSchema/auth-schema";

const GENERIC_AUTH_ERROR = "Invalid email or password.";

export const register = actionClient
  .metadata({ actionName: "auth:register" })
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
          callbackURL: ROUTES.ADMIN,
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
        enumerationSafe: true,
        genericMessage: GENERIC_AUTH_ERROR,
      });
    }
  });

export const login = actionClient
  .metadata({ actionName: "auth:login" })
  .inputSchema(LoginSchema)
  .action(async ({ parsedInput }) => {
    try {
      return await auth.api.signInEmail({
        headers: await headers(),
        body: {
          email: parsedInput.email,
          password: parsedInput.password,
          callbackURL: ROUTES.ADMIN,
        },
      });
    } catch (error) {
      throw fromBetterAuthError(error, {
        enumerationSafe: true,
        genericMessage: GENERIC_AUTH_ERROR,
      });
    }
  });

export const signInWithGoogle = actionClient
  .metadata({ actionName: "auth:signInWithGoogle" })
  .action(async () => {
    try {
      return await auth.api.signInSocial({
        headers: await headers(),
        body: {
          provider: "google",
          callbackURL: ROUTES.ADMIN,
        },
      });
    } catch (error) {
      throw fromBetterAuthError(error, {
        enumerationSafe: true,
        genericMessage: GENERIC_AUTH_ERROR,
      });
    }
  });

export const forgotPassword = actionClient
  .metadata({ actionName: "auth:forgotPassword" })
  .inputSchema(ForgotPasswordSchema)
  .action(async ({ parsedInput }) => {
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

    return {
      message:
        "If an account exists for this email, a password reset link has been sent.",
    };
  });

const ResetPasswordInputSchema = ResetPasswordSchema.extend({
  token: z.string().min(1, {
    message: "Invalid or expired reset link.",
  }),
});

export const resetPassword = actionClient
  .metadata({ actionName: "auth:resetPassword" })
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
      throw fromBetterAuthError(error);
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
  .metadata({ actionName: "auth:resendVerification" })
  .inputSchema(ResendVerificationSchema)
  .action(async ({ parsedInput }) => {
    try {
      await auth.api.sendVerificationEmail({
        headers: await headers(),

        body: {
          email: parsedInput.email,
          callbackURL: ROUTES.ADMIN,
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
  .metadata({ actionName: "auth:signOut" })
  .action(async () => {
    try {
      return await auth.api.signOut({
        headers: await headers(),
      });
    } catch (error) {
      throw new InternalServerError("Failed to sign out", error);
    }
  });
