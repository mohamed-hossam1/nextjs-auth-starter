import { z } from "zod";

export function sanitizeOutput<TInputSchema extends z.ZodTypeAny>(
  schema: TInputSchema,
  data: unknown,
): z.infer<TInputSchema> {
  return schema.parse(data);
}
