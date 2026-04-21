import "server-only";

import { pingram, type EmailRecipient } from "./send-email";

type SendVerificationEmailArgs = {
  user: EmailRecipient;
  url: string;
  newEmail?: string;
};

export async function sendEmailVerificationEmail({
  user,
  url,
  newEmail,
}: SendVerificationEmailArgs) {
  await pingram.send({
    type: "traqon_sender",
    to: {
      id: user.id,
      email: newEmail ?? user.email,
    },
    parameters: {
      verification_url: url,
    },
    templateId: "verification_email",
  });
}
