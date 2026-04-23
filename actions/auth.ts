"use server";

import { headers } from "next/headers";
import { isAPIError } from "better-auth/api";
import { betterAuthError } from "@/lib/actionHandler/better-auth-error";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { ROUTES } from "@/constants/routes";
import { db } from "@/db";
import { user as userTable } from "@/db/schema/auth-schema";
import { auth } from "@/lib/auth";
import { publicAction } from "@/lib/actionHandler/builders/public-action";
import { BadRequestError } from "@/lib/actionHandler/errors";
import { isValidateEmail } from "@/lib/email-validation";
import {
  ForgotPasswordSchema,
  LoginSchema,
  RegisterSchema,
  ResetPasswordSchema,
} from "@/lib/schema/auth-schema";

const GENERIC_AUTH_ERROR = "Invalid email or password.";

export const register = publicAction({
  name: "auth.register",
  input: RegisterSchema,
}).action(async ({ input }) => {
  const emailError = await isValidateEmail(input.email);
  if (emailError) {
    throw new BadRequestError(emailError);
  }

  // Better-auth's `signUpEmail` with `requireEmailVerification: true`
  // intentionally returns a synthetic success when the email already exists
  // (anti-enumeration). We pre-check the user table so we can surface a
  // clear "already exists" message. This trades the anti-enumeration
  // property for UX clarity.
  const existing = await db.query.user.findFirst({
    where: eq(userTable.email, input.email),
    columns: { id: true },
  });
  if (existing) {
    throw new BadRequestError(
      "An account with this email already exists. Please sign in instead.",
    );
  }

  try {
    return await auth.api.signUpEmail({
      headers: await headers(),
      body: {
        name: input.name,
        email: input.email,
        password: input.password,
        callbackURL: ROUTES.ADMIN,
      },
    });
  } catch (error) {
    if (isAPIError(error)) {
      const apiErr = error as unknown as { message?: string; statusCode?: number };
      const message = apiErr.message ?? "";
      if (apiErr.statusCode === 422 || /already/i.test(message)) {
        throw new BadRequestError(
          "An account with this email already exists. Please sign in instead.",
          error,
        );
      }
    }
    throw betterAuthError(error, "auth:register", { enumerationSafe: true, genericMessage: GENERIC_AUTH_ERROR });
  }
});

export const login = publicAction({
  name: "auth.login",
  input: LoginSchema,
}).action(async ({ input }) => {
  try {
    return await auth.api.signInEmail({
      headers: await headers(),
      body: {
        email: input.email,
        password: input.password,
        callbackURL: ROUTES.ADMIN,
      },
    });
  } catch (error) {
    throw betterAuthError(error, "auth:login", { enumerationSafe: true, genericMessage: GENERIC_AUTH_ERROR });
  }
});

export const signInWithGoogle = publicAction({
  name: "auth.signInWithGoogle",
}).action(async () => {
  try {
    return await auth.api.signInSocial({
      headers: await headers(),
      body: {
        provider: "google",
        callbackURL: ROUTES.ADMIN,
      },
    });
  } catch (error) {
    throw betterAuthError(error, "auth:google", { enumerationSafe: true, genericMessage: GENERIC_AUTH_ERROR });
  }
});

const GENERIC_RESET_RESPONSE = z.object({ message: z.string() });

export const forgotPassword = publicAction({
  name: "auth.forgotPassword",
  input: ForgotPasswordSchema,
  output: GENERIC_RESET_RESPONSE,
}).action(async ({ input }) => {
  try {
    await auth.api.requestPasswordReset({
      body: {
        email: input.email,
        redirectTo: `${ROUTES.RESETPASSWORD}?type=forgot`,
      },
    });
  } catch (error) {
    if (isAPIError(error)) {
      console.warn(
        "[auth:forgotPassword] suppressed:",
        (error as unknown as { message?: string }).message,
      );
    } else {
      console.error("[auth:forgotPassword] internal error:", error);
    }
  }

  return {
    message:
      "If an account exists for this email, a password reset link has been sent.",
  };
});

const ResetPasswordInputSchema = ResetPasswordSchema.extend({
  token: z.string().min(1, { message: "Invalid or expired reset link." }),
});

export const resetPassword = publicAction({
  name: "auth.resetPassword",
  input: ResetPasswordInputSchema,
}).action(async ({ input }) => {
  try {
    return await auth.api.resetPassword({
      body: {
        newPassword: input.password,
        token: input.token,
      },
    });
  } catch (error) {
    throw betterAuthError(error, "auth:resetPassword");
  }
});

export const signOut = publicAction({
  name: "auth.signOut",
}).action(async () => {
  try {
    return await auth.api.signOut({ headers: await headers() });
  } catch (error) {
    throw betterAuthError(error, "auth:signOut");
  }
});
