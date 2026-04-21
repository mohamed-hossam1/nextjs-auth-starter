"use server";

import { headers } from "next/headers";
import { isAPIError } from "better-auth/api";
import { z } from "zod";

import { ROUTES } from "@/constants/routes";
import { auth } from "@/lib/auth";
import { handleAction } from "@/lib/handleErrors/action-handler";
import { AppError } from "@/lib/handleErrors/error";
import { isValidateEmail } from "@/lib/handleErrors/email-validation";
import { zodValidate } from "@/lib/handleErrors/zod-validate";
import {
  ForgotPasswordSchema,
  LoginSchema,
  RegisterSchema,
  ResetPasswordSchema,
} from "@/lib/schema/auth-schema";

const GENERIC_AUTH_ERROR = "Invalid email or password.";
const GENERIC_RESET_RESPONSE = {
  message:
    "If an account exists for this email, a password reset link has been sent.",
};

type ApiErrorLike = {
  message?: string;
  statusCode?: number;
  status?: string;
};

function mapAuthError(
  error: unknown,
  context: string,
  options: { enumerationSafe: boolean },
): AppError {
  if (isAPIError(error)) {
    const apiError = error as unknown as ApiErrorLike;
    const status = apiError.statusCode ?? 400;
    if (options.enumerationSafe) {
      console.warn(`[auth:${context}]`, apiError.message ?? apiError.status);
      return new AppError(GENERIC_AUTH_ERROR, status >= 500 ? 500 : 400);
    }
    return new AppError(apiError.message ?? GENERIC_AUTH_ERROR, status);
  }
  console.error(`[auth:${context}] internal error:`, error);
  return new AppError("Something went wrong", 500);
}

export async function register(formData: z.infer<typeof RegisterSchema>) {
  return handleAction(async () => {
    const validated = zodValidate(RegisterSchema, formData);
    const emailError = await isValidateEmail(validated.email);
    if (emailError) {
      throw new AppError(emailError, 400);
    }

    try {
      return await auth.api.signUpEmail({
        headers: await headers(),
        body: {
          name: validated.name,
          email: validated.email,
          password: validated.password,
          callbackURL: ROUTES.ADMIN,
        },
      });
    } catch (error) {
      if (isAPIError(error)) {
        const apiError = error as unknown as ApiErrorLike;
        const message = apiError.message ?? "";
        if (apiError.statusCode === 422 || /already/i.test(message)) {
          throw new AppError(
            "We couldn't create that account. Please try again or sign in.",
            400,
          );
        }
      }
      throw mapAuthError(error, "register", { enumerationSafe: true });
    }
  });
}

export async function login(formData: z.infer<typeof LoginSchema>) {
  return handleAction(async () => {
    const validated = zodValidate(LoginSchema, formData);
    try {
      return await auth.api.signInEmail({
        headers: await headers(),
        body: {
          email: validated.email,
          password: validated.password,
          callbackURL: ROUTES.ADMIN,
        },
      });
    } catch (error) {
      throw mapAuthError(error, "login", { enumerationSafe: true });
    }
  });
}

export async function signInWithGoogle(_authType: "LOGIN" | "REGISTER") {
  return handleAction(async () => {
    try {
      return await auth.api.signInSocial({
        headers: await headers(),
        body: {
          provider: "google",
          callbackURL: ROUTES.ADMIN,
        },
      });
    } catch (error) {
      throw mapAuthError(error, "google", { enumerationSafe: true });
    }
  });
}

export async function forgotPassword(
  formData: z.infer<typeof ForgotPasswordSchema>,
) {
  return handleAction(async () => {
    const validated = zodValidate(ForgotPasswordSchema, formData);
    try {
      await auth.api.requestPasswordReset({
        body: {
          email: validated.email,
          redirectTo: `${ROUTES.RESETPASSWORD}?type=forgot`,
        },
      });
    } catch (error) {
      if (isAPIError(error)) {
        console.warn(
          "[auth:forgotPassword] suppressed:",
          (error as unknown as ApiErrorLike).message,
        );
      } else {
        console.error("[auth:forgotPassword] internal error:", error);
      }
    }
    return GENERIC_RESET_RESPONSE;
  });
}

export async function resetPassword(
  formData: z.infer<typeof ResetPasswordSchema> & { token: string },
) {
  return handleAction(async () => {
    const validated = zodValidate(ResetPasswordSchema, formData);
    if (!formData.token || typeof formData.token !== "string") {
      throw new AppError("Invalid or expired reset link.", 400);
    }
    try {
      return await auth.api.resetPassword({
        body: {
          newPassword: validated.password,
          token: formData.token,
        },
      });
    } catch (error) {
      throw mapAuthError(error, "resetPassword", { enumerationSafe: false });
    }
  });
}

export async function signOut() {
  return handleAction(async () => {
    try {
      return await auth.api.signOut({ headers: await headers() });
    } catch (error) {
      throw mapAuthError(error, "signOut", { enumerationSafe: false });
    }
  });
}
