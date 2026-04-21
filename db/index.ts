import "server-only";

// Safety net: when this module is imported by a standalone Node/Bun script
// (e.g. a one-off seed runner) outside of the Next.js runtime, `.env.local`
// is not auto-loaded. Importing dotenv here is a no-op when env vars are
// already set (which is the case during `next dev` / `next build`).
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local", override: false });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { serverEnv } from "@/lib/env";
import * as schema from "./schema";

const env = serverEnv();

/**
 * Postgres client.
 *
 * `prepare: false` is required for compatibility with the Supabase pooler
 * in transaction mode (PgBouncer in transaction pooling mode does not
 * support session-scoped prepared statements).
 *
 * NOTE: in serverless deployments this module is reused across invocations
 * within the same lambda, so the client is created once per cold start
 * rather than once per request — exactly what we want.
 */
const client = postgres(env.DATABASE_URL, { prepare: false });

export const db = drizzle(client, { schema });
