import { z } from "zod";
import { requireUser } from "./auth";
import { createErrorResponse } from "./error-handler";
import { withTiming } from "./logger";
import { validateInput, validateOutput } from "./validation";
import type {
  ActionContext,
  ActionHandler,
  ActionMiddleware,
  ActionResult,
  ActionSuccess,
} from "./types";

type CreateActionOptions<
  TInputSchema extends z.ZodTypeAny,
  TOutputSchema extends z.ZodTypeAny,
> = {
  name: string;
  input?: TInputSchema;
  output?: TOutputSchema;
  protected?: boolean;

  middlewares?: ActionMiddleware<
    [TInputSchema] extends [z.ZodNever] ? unknown : z.infer<TInputSchema>
  >[];
};

export function createAction<
  TInputSchema extends z.ZodTypeAny = z.ZodNever,
  TOutputSchema extends z.ZodTypeAny = z.ZodNever,
>(options: CreateActionOptions<TInputSchema, TOutputSchema>) {
  type ResolvedInput = [TInputSchema] extends [z.ZodNever]
    ? never
    : z.infer<TInputSchema>;

  return {
    action<TOutput>(handler: ActionHandler<ResolvedInput, TOutput>) {
      type ResolvedOutput = [TOutputSchema] extends [z.ZodNever]
        ? TOutput
        : z.infer<TOutputSchema>;

      return async (
        rawInput?: unknown,
      ): Promise<ActionResult<ResolvedOutput>> => {
        try {
          return await withTiming({
            action: options.name,

            fn: async () => {
              const input = (
                options.input
                  ? validateInput(options.input, rawInput)
                  : rawInput
              ) as ResolvedInput;

              const ctx: ActionContext = {
                user: options.protected ? await requireUser() : null,
              };

              if (options.middlewares?.length) {
                for (const middleware of options.middlewares) {
                  await middleware({ input, ctx });
                }
              }

              const result = await handler({ input, ctx });

              const data = (
                options.output
                  ? validateOutput(options.output, result)
                  : result
              ) as ResolvedOutput;

              const success: ActionSuccess<ResolvedOutput> = {
                success: true,
                data,
              };

              return success;
            },
          });
        } catch (error) {
          // `withTiming` already logs the failure with timing/duration metadata,
          // so we only translate the error into the public failure shape here.
          return createErrorResponse(error);
        }
      };
    },
  };
}
