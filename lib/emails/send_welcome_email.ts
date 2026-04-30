

import { ROUTES } from "@/constants/routes";
import { publicEnv } from "@/lib/env";
import { pingram, type EmailRecipient } from "./send-email";

type SendWelcomeEmailArgs = {
  user: EmailRecipient;
};

export async function sendWelcomeEmail({ user }: SendWelcomeEmailArgs) {
  await pingram.send({
    type: "traqon_sender",
    to: {
      id: user.id,
      email: user.email,
    },
    parameters: {
      user_name: user.name?.trim() || "there",
      dashboard_url: `${publicEnv.appUrl}${ROUTES.ADMIN}`,
    },
    templateId: "welcome_email",
  });
}
