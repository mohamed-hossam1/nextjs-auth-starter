import { z } from "zod";
import { InternalServerError } from "./errors";
import { createValidationError } from "./utils/create-validation-error";

export function validateInput<TSchema extends z.ZodTypeAny>(
  schema: TSchema,

  input: unknown,
): z.infer<TSchema> {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw createValidationError(result.error);
  }

  return result.data;
}

export function validateOutput<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  output: unknown,
): z.infer<TSchema> {
  const result = schema.safeParse(output);

  if (!result.success) {
    throw new InternalServerError("Invalid action output", result.error);
  }

  return result.data;
}
