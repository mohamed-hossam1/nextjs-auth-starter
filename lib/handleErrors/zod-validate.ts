import { z } from "zod";
import { ValidationError } from "./error";

export function zodValidate<T extends z.ZodObject<any>>(
  schema: T,
  data: unknown,
  mode: "ALL" | "PARTIAL" = "ALL",
): z.infer<T> {
  const usedSchema = mode === "PARTIAL" ? schema.partial() : schema;

  const result = usedSchema.safeParse(data);
  

  if (!result.success) {
    const fieldErrors = Object.fromEntries(
      Object.entries(result.error.flatten().fieldErrors).map(([k, v]) => [
        k,
        v ?? [],
      ]),
    ) as Record<string, string[]>;
    

    throw new ValidationError(fieldErrors);
  }

  return result.data as z.infer<T>;
}