import { betterAuth } from "better-auth";
import type { Logger } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/db";
import { sendEmailVerificationEmail } from "./emails/verification-email";
import { sendPasswordResetEmail } from "./emails/password-reset-email";
import { sendWelcomeEmail } from "./emails/send_welcome_email";
import { serverEnv } from "./env";
import { logError, logInfo, logWarn } from "./next-action-handler/log/logger";

const env = serverEnv();

const authLogger: Logger = {
  disabled: false,
  disableColors: false,
  level: "warn",
  log(level, message, ...args) {
    const meta = args.length ? { args } : undefined;

    if (level === "error") {
      logError({ action: "auth.logger", message, meta });
      return;
    }

    if (level === "warn") {
      logWarn({ action: "auth.logger", message, meta });
      return;
    }

    logInfo({ action: "auth.logger", message, meta });
  },
};

async function bestEffortEmail(
  label: string,
  send: () => Promise<void>,
): Promise<void> {
  try {
    await send();
  } catch (error) {
    logError({
      action: `email.${label}`,
      message: "Failed to send email",
      meta: { error },
    });
  }
}

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  logger: authLogger,

  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
        await sendEmailVerificationEmail({ user, url, newEmail });
      },
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 6,
    maxPasswordLength: 100,
    sendResetPassword: async ({ user, url }) => {
      await bestEffortEmail("password-reset", () =>
        sendPasswordResetEmail({ user, url }),
      );
    },
  },

  emailVerification: {
    autoSignInAfterVerification: true,
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await bestEffortEmail("verification", () =>
        sendEmailVerificationEmail({ user, url }),
      );
    },
    async afterEmailVerification(user) {
      await bestEffortEmail("welcome", () => sendWelcomeEmail({ user }));
    },
  },

  socialProviders: {
    google: {
      prompt: "select_account",
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60,
    },
  },

  plugins: [nextCookies()],
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
});
