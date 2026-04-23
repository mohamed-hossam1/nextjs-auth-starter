import type { ErrorCode } from "./errors";

export type ActionSuccess<T> = {
  success: true;
  data: T;
};

export type ActionFailure = {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    fields?: Record<string, string[]>;
  };
};

export type ActionResult<T> = ActionSuccess<T> | ActionFailure;

export type UserRole = "USER" | "ADMIN";

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
};

export type ActionContext = {
  user: AuthUser | null;
};

export type ActionHandler<TInput, TOutput> = (args: {
  input: TInput;
  ctx: ActionContext;
}) => Promise<TOutput>;

export type ActionMiddleware<TInput = unknown> = (args: {
  input: TInput;
  ctx: ActionContext;
}) => Promise<void>;
