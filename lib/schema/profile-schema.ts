import { z } from "zod";

const PasswordRule = z
  .string()
  .min(6, { message: "Password must be at least 6 characters long." })
  .max(100, { message: "Password cannot exceed 100 characters." });

export const UpdateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, { message: "Username must be at least 3 characters long." })
    .max(30, { message: "Username cannot exceed 30 characters." }),
});

export const ChangeEmailSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required." })
    .email({ message: "Please provide a valid email address." })
    .transform((value) => value.trim().toLowerCase()),
});

export const ChangePasswordSchema = z.object({
  currentPassword: PasswordRule,
  newPassword: PasswordRule,
});
