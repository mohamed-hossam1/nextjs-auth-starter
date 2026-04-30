

import { pingram, type EmailRecipient } from "./send-email";

type SendPasswordResetEmailArgs = {
  user: EmailRecipient;
  url: string;
};

export async function sendPasswordResetEmail({
  user,
  url,
}: SendPasswordResetEmailArgs) {
  await pingram.send({
    type: "traqon_sender",
    to: {
      id: user.id,
      email: user.email,
    },
    parameters: {
      reset_password_url: url,
    },
    templateId: "reset_password",
  });
}
