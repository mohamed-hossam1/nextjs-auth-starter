export const sessionQueryKey = ["session"] as const;

export const accountQueryKey = ["account"] as const;
export const accountHasPasswordQueryKey = [
  ...accountQueryKey,
  "has-password",
] as const;
export const accountSessionsQueryKey = [
  ...accountQueryKey,
  "sessions",
] as const;