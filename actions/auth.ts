"use server";
import { headers } from "next/headers";

import { handleAction } from "@/lib/handleErrors/action-handler";
import { auth } from "@/lib/auth";
import { AppError } from "@/lib/handleErrors/error";
import {
  ForgotPasswordSchema,
  LoginSchema,
  RegisterSchema,
  ResetPasswordSchema,
} from "@/lib/schema/auth-schema";
import { zodValidate } from "@/lib/handleErrors/zod-validate";
import { z } from "zod";
import { isValidateEmail } from "@/lib/handleErrors/email-validation";
import { ROUTES } from "@/constants/routes";

import { isAPIError } from "better-auth/api";

export async function register(formData: z.infer<typeof RegisterSchema>) {
  return handleAction(async () => {
    const validated = zodValidate(RegisterSchema, formData);
    const emailError = await isValidateEmail(validated.email);
    if (emailError) {
      throw new AppError(emailError, 400);
    }

    let response;
    try {
      response = await auth.api.signUpEmail({
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
        throw new AppError(error.message, error.statusCode);
      }
      console.error("Signup internal server error:", error);
      throw new AppError("Something went wrong", 500);
    }
    return response;
  });
}

export async function login(formData: z.infer<typeof LoginSchema>) {
  return handleAction(async () => {
    const validated = zodValidate(LoginSchema, formData);

    let response;
    try {
      response = await auth.api.signInEmail({
        headers: await headers(),
        body: {
          email: validated.email,
          password: validated.password,
          callbackURL: ROUTES.ADMIN,
        },
      });
    } catch (error) {
      if (isAPIError(error)) {
        throw new AppError(error.message, error.statusCode);
      }
      console.error("Login internal server error:", error);
      throw new AppError("Something went wrong", 500);
    }
    return response;
  });
}

export async function signInWithGoogle(authType: "LOGIN" | "REGISTER") {
  return handleAction(async () => {
    void authType;

    let response;
    try {
      response = await auth.api.signInSocial({
        headers: await headers(),
        body: {
          provider: "google",
          callbackURL: ROUTES.ADMIN,
        },
      });
    } catch (error) {
      if (isAPIError(error)) {
        throw new AppError(error.message, error.statusCode);
      }
      console.error("Google sign in internal server error:", error);
      throw new AppError("Something went wrong", 500);
    }
    return response;
  });
}

export async function forgotPassword(
  formData: z.infer<typeof ForgotPasswordSchema>,
) {
  return handleAction(async () => {
    const validated = zodValidate(ForgotPasswordSchema, formData);

    let response;
    try {
      response = await auth.api.requestPasswordReset({
        body: {
          email: validated.email,
          redirectTo: `${ROUTES.RESETPASSWORD}?type=forgot`,
        },
      });
    } catch (error) {
      if (isAPIError(error)) {
        throw new AppError(error.message, error.statusCode);
      }
      console.error("Forgot password internal server error:", error);
      throw new AppError("Something went wrong", 500);
    }
    return response;
  });
}

export async function resetPassword(
  formData: z.infer<typeof ResetPasswordSchema> & { token: string },
) {
  return handleAction(async () => {
    const validated = zodValidate(ResetPasswordSchema, formData);

    let response;
    try {
      response = await auth.api.resetPassword({
        body: {
          newPassword: validated.password,
          token: formData.token,
        },
      });
    } catch (error) {
      if (isAPIError(error)) {
        throw new AppError(error.message, error.statusCode);
      }
      console.error("Reset password internal server error:", error);
      throw new AppError("Something went wrong", 500);
    }
    return response;
  });
}

export async function signOut() {
  return handleAction(async () => {
    let response;
    try {
      response = await auth.api.signOut({
        headers: await headers(),
      });
    } catch (error) {
      if (isAPIError(error)) {
        throw new AppError(error.message, error.statusCode);
      }
      console.error("Sign out internal server error:", error);
      throw new AppError("Something went wrong", 500);
    }
    return response;
  });
}
