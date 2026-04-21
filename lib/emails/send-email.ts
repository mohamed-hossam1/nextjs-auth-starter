import "server-only";

import { Pingram } from "pingram";

import { serverEnv } from "@/lib/env";

const env = serverEnv();

export const pingram = new Pingram({
  apiKey: env.PINGRAM_API_KEY,
  baseUrl: env.PINGRAM_BASE_URL,
});

export type EmailRecipient = {
  id: string;
  email: string;
  name?: string | null;
};
