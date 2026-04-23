import { z } from "zod";
import { createAction } from "../create-action";
import type { ActionMiddleware } from "../types";

type ProtectedActionOptions<
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

export function protectedAction<
  TInputSchema extends z.ZodTypeAny = z.ZodNever,
  TOutputSchema extends z.ZodTypeAny = z.ZodNever,
>(options: ProtectedActionOptions<TInputSchema, TOutputSchema>) {
  return createAction<TInputSchema, TOutputSchema>({
    ...options,

    protected: true,
  });
}
