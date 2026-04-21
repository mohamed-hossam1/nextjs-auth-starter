const isServer = typeof window === "undefined";

function readRequired(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(
      `[env] Required environment variable "${name}" is missing. ` +
        `Set it in your environment before building/running the app.`,
    );
  }
  return value;
}

function readOptional(value: string | undefined): string | undefined {
  return value && value.trim() !== "" ? value : undefined;
}

function stripTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

const NEXT_PUBLIC_APP_URL = stripTrailingSlash(
  readRequired(
    "NEXT_PUBLIC_APP_URL",
    process.env.NEXT_PUBLIC_APP_URL ??
      process.env.NEXT_PUBLIC_BASE_URL ??
      (isServer ? process.env.BETTER_AUTH_URL : undefined),
  ),
);

let serverEnvCache: {
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  PINGRAM_API_KEY: string;
  PINGRAM_BASE_URL: string;
  NODE_ENV: "development" | "test" | "production";
} | null = null;

function getServerEnv() {
  if (!isServer) {
    throw new Error(
      "[env] Server-only environment variables accessed from the client. " +
        "Move this access to a server module ('use server' or RSC).",
    );
  }
  if (serverEnvCache) return serverEnvCache;

  serverEnvCache = {
    DATABASE_URL: readRequired("DATABASE_URL", process.env.DATABASE_URL),
    BETTER_AUTH_SECRET: readRequired(
      "BETTER_AUTH_SECRET",
      process.env.BETTER_AUTH_SECRET,
    ),
    BETTER_AUTH_URL: stripTrailingSlash(
      process.env.BETTER_AUTH_URL?.trim() || NEXT_PUBLIC_APP_URL,
    ),
    GOOGLE_CLIENT_ID: readRequired(
      "GOOGLE_CLIENT_ID",
      process.env.GOOGLE_CLIENT_ID,
    ),
    GOOGLE_CLIENT_SECRET: readRequired(
      "GOOGLE_CLIENT_SECRET",
      process.env.GOOGLE_CLIENT_SECRET,
    ),
    PINGRAM_API_KEY: readRequired(
      "PINGRAM_API_KEY",
      process.env.PINGRAM_API_KEY,
    ),
    PINGRAM_BASE_URL: readRequired(
      "PINGRAM_BASE_URL",
      process.env.PINGRAM_BASE_URL,
    ),
    NODE_ENV: (readOptional(process.env.NODE_ENV) ?? "development") as
      | "development"
      | "test"
      | "production",
  };

  return serverEnvCache;
}

export const publicEnv = {
  appUrl: NEXT_PUBLIC_APP_URL,
} as const;

export { getServerEnv as serverEnv };
