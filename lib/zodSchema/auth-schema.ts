import { z } from "zod";

const PasswordRule = z
  .string()
  .min(6, { message: "Password must be at least 6 characters long." })
  .max(100, { message: "Password cannot exceed 100 characters." });

const EmailRule = z
  .string()
  .min(1, { message: "Email is required." })
  .email({ message: "Please provide a valid email address." })
  .transform((value) => value.trim().toLowerCase());

export const LoginSchema = z.object({
  email: EmailRule,
  password: PasswordRule,
});

export const RegisterSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, { message: "Username must be at least 3 characters long." })
    .max(30, { message: "Username cannot exceed 30 characters." }),
  email: EmailRule,
  password: PasswordRule,
});

export const ForgotPasswordSchema = z.object({
  email: EmailRule,
});

export const ResetPasswordSchema = z.object({
  password: PasswordRule,
});

export const SafeAccountSchema = z.object({
  id: z.string(),
  providerId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type SafeAccount = z.infer<typeof SafeAccountSchema>;

