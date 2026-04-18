import { pingram } from "./send-email";

export async function sendPasswordResetEmail({
  user,
  url,
}: {
  user: any;
  url: string;
}) {
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
