import { z } from "zod";
import { ERROR_CODES } from "../errors";

export const actionErrorSchema = z.object({
  code: z.enum(ERROR_CODES),
  message: z.string(),
});
