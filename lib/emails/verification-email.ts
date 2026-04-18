import { pingram } from "./send-email";

export async function sendEmailVerificationEmail({
  user,
  url,
  newEmail,
}: {
  user: any;
  url: string;
  newEmail?: string;
}) {
  await pingram.send({
    type: "traqon_sender",
    to: {
      id: user.id,
      email: newEmail ? newEmail : user.email,
    },
    parameters: {
      verification_url: url,
    },
    templateId: "verification_email",
  });
}
