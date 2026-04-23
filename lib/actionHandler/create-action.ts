import { z } from "zod";
import { requireUser } from "./auth";
import {
  ActionError,
  DatabaseError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  ValidationError,
} from "./errors";
import { withTiming } from "./logger";
import type {
  ActionContext,
  ActionFailure,
  ActionHandler,
  ActionMiddleware,
  ActionResult,
  ActionSuccess,
} from "./types";

// ─────────────────────────────────────────────────────────────
// 1. Input / Output Validation
// ─────────────────────────────────────────────────────────────

function validateInput<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  input: unknown,
): z.infer<TSchema> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const fields: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".") || "_root";
      (fields[key] ??= []).push(issue.message);
    }
    throw new ValidationError({ message: "Invalid input", fields, cause: result.error });
  }
  return result.data;
}

function validateOutput<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  output: unknown,
): z.infer<TSchema> {
  const result = schema.safeParse(output);
  if (!result.success) {
    throw new InternalServerError("Invalid action output", result.error);
  }
  return result.data;
}

// ─────────────────────────────────────────────────────────────
// 2. Error Normalization
//    Turns any thrown value into a structured ActionFailure.
// ─────────────────────────────────────────────────────────────

function normalizeError(error: unknown): ActionError {
  if (error instanceof ActionError) return error;

  if (typeof error === "object" && error !== null && "code" in error) {
    const pgCode = String((error as { code?: unknown }).code);

    if (pgCode === "23505") return new ValidationError({ message: "This value already exists", cause: error });
    if (pgCode === "23503") return new ValidationError({ message: "Invalid reference", cause: error });
    if (pgCode === "23502") return new ValidationError({ message: "Missing required field", cause: error });
    if ((error as { message?: string }).message?.includes("No rows"))
      return new NotFoundError("Resource not found", error);

    return new DatabaseError(undefined, error);
  }

  if (error instanceof Error) return new InternalServerError(undefined, error);
  return new InternalServerError();
}

function toFailure(error: unknown): ActionFailure {
  const normalized = normalizeError(error);
  return {
    success: false,
    error: {
      code: normalized.code,
      message: normalized.expose ? normalized.message : "Something went wrong",
      ...(normalized instanceof ValidationError &&
        normalized.fields && { fields: normalized.fields }),
    },
  };
}

// ─────────────────────────────────────────────────────────────
// 3. Core — createAction
// ─────────────────────────────────────────────────────────────

type ActionOptions<
  TInputSchema extends z.ZodTypeAny,
  TOutputSchema extends z.ZodTypeAny,
> = {
  name: string;
  input?: TInputSchema;
  output?: TOutputSchema;
  /** Require a logged-in user. `ctx.user` will be non-null inside the handler. */
  protected?: boolean;
  middlewares?: ActionMiddleware<
    [TInputSchema] extends [z.ZodNever] ? unknown : z.infer<TInputSchema>
  >[];
};

export function createAction<
  TInputSchema extends z.ZodTypeAny = z.ZodNever,
  TOutputSchema extends z.ZodTypeAny = z.ZodNever,
>(options: ActionOptions<TInputSchema, TOutputSchema>) {
  type ResolvedInput = [TInputSchema] extends [z.ZodNever]
    ? never
    : z.infer<TInputSchema>;

  return {
    action<TOutput>(handler: ActionHandler<ResolvedInput, TOutput>) {
      type ResolvedOutput = [TOutputSchema] extends [z.ZodNever]
        ? TOutput
        : z.infer<TOutputSchema>;

      return async (rawInput?: unknown): Promise<ActionResult<ResolvedOutput>> => {
        try {
          return await withTiming({
            action: options.name,
            fn: async () => {
              const input = (
                options.input ? validateInput(options.input, rawInput) : rawInput
              ) as ResolvedInput;

              const ctx: ActionContext = {
                user: options.protected ? await requireUser() : null,
              };

              for (const middleware of options.middlewares ?? []) {
                await middleware({ input, ctx });
              }

              const result = await handler({ input, ctx });

              const data = (
                options.output ? validateOutput(options.output, result) : result
              ) as ResolvedOutput;

              const success: ActionSuccess<ResolvedOutput> = { success: true, data };
              return success;
            },
          });
        } catch (error) {
          return toFailure(error);
        }
      };
    },
  };
}

// ─────────────────────────────────────────────────────────────
// 4. Named Builders
//    Thin wrappers so call-sites read like plain English.
// ─────────────────────────────────────────────────────────────

type BuilderOptions<
  TInputSchema extends z.ZodTypeAny,
  TOutputSchema extends z.ZodTypeAny,
> = Omit<ActionOptions<TInputSchema, TOutputSchema>, "protected">;

export function publicAction<
  TInputSchema extends z.ZodTypeAny = z.ZodNever,
  TOutputSchema extends z.ZodTypeAny = z.ZodNever,
>(options: BuilderOptions<TInputSchema, TOutputSchema>) {
  return createAction<TInputSchema, TOutputSchema>({ ...options, protected: false });
}

export function protectedAction<
  TInputSchema extends z.ZodTypeAny = z.ZodNever,
  TOutputSchema extends z.ZodTypeAny = z.ZodNever,
>(options: BuilderOptions<TInputSchema, TOutputSchema>) {
  return createAction<TInputSchema, TOutputSchema>({ ...options, protected: true });
}

export function adminAction<
  TInputSchema extends z.ZodTypeAny = z.ZodNever,
  TOutputSchema extends z.ZodTypeAny = z.ZodNever,
>(options: BuilderOptions<TInputSchema, TOutputSchema>) {
  return createAction<TInputSchema, TOutputSchema>({
    ...options,
    protected: true,
    middlewares: [
      async ({ ctx }) => {
        if (ctx.user?.role !== "ADMIN") throw new ForbiddenError();
      },
      ...(options.middlewares ?? []),
    ],
  });
}

export { normalizeError, toFailure as createErrorResponse };
