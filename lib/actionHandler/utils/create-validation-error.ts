import { z } from "zod";
import { ValidationError } from "../errors";

export function createValidationError(error: z.ZodError) {
  const fields: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const key = issue.path.join(".");

    if (!fields[key]) {
      fields[key] = [];
    }

    fields[key]?.push(issue.message);
  }

  return new ValidationError({
    message: "Invalid input",

    fields,

    cause: error,
  });
}
