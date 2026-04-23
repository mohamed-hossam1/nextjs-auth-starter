import { z } from "zod";
import { actionErrorSchema } from "./action-error-schema";

export const validationErrorSchema = actionErrorSchema.extend({
  fields: z.record(z.string(), z.array(z.string())),
});
