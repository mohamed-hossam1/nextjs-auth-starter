import { Pingram } from "pingram";

export const pingram = new Pingram({
  apiKey: process.env.PINGRAM_API_KEY as string,
  baseUrl: process.env.PINGRAM_BASE_URL as string,
});