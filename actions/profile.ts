"use server";
import { headers } from "next/headers";

import { handleAction } from "@/lib/handleErrors/action-handler";
import { auth } from "@/lib/auth";
import { AppError } from "@/lib/handleErrors/error";
import { zodValidate } from "@/lib/handleErrors/zod-validate";
import { z } from "zod";
import { ROUTES } from "@/constants/routes";
import { isAPIError } from "better-auth/api";
import {
  ChangePasswordSchema,
  UpdateProfileSchema,
} from "@/lib/schema/profile-schema";

export async function updateProfile(
  formData: z.infer<typeof UpdateProfileSchema>,
) {
  return handleAction(async () => {
    const validated = zodValidate(UpdateProfileSchema, formData);

    let response;
    try {
      response = await auth.api.updateUser({
        headers: await headers(),
        body: {
          name: validated.name,
        },
      });
    } catch (error) {
      if (isAPIError(error)) {
        throw new AppError(error.message, error.statusCode);
      }
      console.error("Update profile internal server error:", error);
      throw new AppError("Something went wrong", 500);
    }
    return response;
  });
}

export async function hasPassword() {
  return handleAction(async () => {
    let response;
    try {
      const accounts = await auth.api.listUserAccounts({
        headers: await headers(),
      });
      response = accounts.some((a) => a.providerId === "credential");
    } catch (error) {
      if (isAPIError(error)) {
        throw new AppError(error.message, error.statusCode);
      }
      console.error("Has password internal server error:", error);
      throw new AppError("Something went wrong", 500);
    }
    return response;
  });
}

export async function sendPasswordResetEmail(email: string) {
  return handleAction(async () => {
    let response;
    try {
      response = await auth.api.requestPasswordReset({
        body: {
          email,
          redirectTo: `${ROUTES.RESETPASSWORD}?type=reset`,
        },
      });
    } catch (error) {
      if (isAPIError(error)) {
        throw new AppError(error.message, error.statusCode);
      }
      console.error("Send password reset email internal server error:", error);
      throw new AppError("Something went wrong", 500);
    }
    return response;
  });
}

export async function changePassword(
  formData: z.infer<typeof ChangePasswordSchema>,
) {
  return handleAction(async () => {
    const validated = zodValidate(ChangePasswordSchema, formData);

    let response;
    try {
      response = await auth.api.changePassword({
        headers: await headers(),
        body: {
          newPassword: validated.newPassword,
          currentPassword: validated.currentPassword,
        },
      });
    } catch (error) {
      if (isAPIError(error)) {
        throw new AppError(error.message, error.statusCode);
      }
      console.error("Change password internal server error:", error);
      throw new AppError("Something went wrong", 500);
    }
    return response;
  });
}

export async function getSessions() {
  return handleAction(async () => {
    let response;
    try {
      response = await auth.api.listSessions({
        headers: await headers(),
      });
    } catch (error) {
      if (isAPIError(error)) {
        throw new AppError(error.message, error.statusCode);
      }
      console.error("Get sessions internal server error:", error);
      throw new AppError("Something went wrong", 500);
    }
    return response;
  });
}

export async function getCurrentSession() {
  return handleAction(async () => {
    let response;
    try {
      response = await auth.api.getSession({
        headers: await headers(),
      });
    } catch (error) {
      if (isAPIError(error)) {
        throw new AppError(error.message, error.statusCode);
      }
      console.error("Get current session internal server error:", error);
      throw new AppError("Something went wrong", 500);
    }
    return response;
  });
}

export async function revokeSession(token: string) {
  return handleAction(async () => {
    let response;
    try {
      response = await auth.api.revokeSession({
        headers: await headers(),
        body: {
          token,
        },
      });
    } catch (error) {
      if (isAPIError(error)) {
        throw new AppError(error.message, error.statusCode);
      }
      console.error("Revoke session internal server error:", error);
      throw new AppError("Something went wrong", 500);
    }
    return response;
  });
}
