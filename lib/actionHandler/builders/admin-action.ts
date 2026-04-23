import { z } from "zod";
import { ForbiddenError } from "../errors";
import { createAction } from "../create-action";
import type { ActionMiddleware } from "../types";

type AdminActionOptions<
  TInputSchema extends z.ZodTypeAny,
  TOutputSchema extends z.ZodTypeAny,
> = {
  name: string;
  input?: TInputSchema;
  output?: TOutputSchema;
  middlewares?: ActionMiddleware<
    [TInputSchema] extends [z.ZodNever] ? unknown : z.infer<TInputSchema>
  >[];
};

export function adminAction<
  TInputSchema extends z.ZodTypeAny = z.ZodNever,
  TOutputSchema extends z.ZodTypeAny = z.ZodNever,
>(options: AdminActionOptions<TInputSchema, TOutputSchema>) {
  return createAction<TInputSchema, TOutputSchema>({
    ...options,
    protected: true,
    middlewares: [
      async ({ ctx }) => {
        if (ctx.user?.role !== "ADMIN") {
          throw new ForbiddenError();
        }
      },
      ...(options.middlewares ?? []),
    ],
  });
}
