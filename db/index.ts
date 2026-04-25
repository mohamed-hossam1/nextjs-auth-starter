import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { serverEnv } from "@/lib/env";
import * as schema from "./schema";
const env = serverEnv();
declare global {
  var __pgClient__: ReturnType<typeof postgres> | undefined;
}
const client =
  global.__pgClient__ ??
  postgres(env.DATABASE_URL, {
    prepare: false,
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
if (env.NODE_ENV !== "production") {
  global.__pgClient__ = client;
}
export const db = drizzle(client, { schema });
