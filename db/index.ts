import { config } from "dotenv";
config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is missing. Please make sure .env.local is loaded or restart your development server.",
  );
}

const connectionString = process.env.DATABASE_URL;

const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
