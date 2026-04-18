import { ROUTES } from "@/constants/routes";
import { pingram } from "./send-email";

export async function sendWelcomeEmail({ user }: { user: any }) {
  await pingram.send({
    type: "traqon_sender",
    to: {
      id: user.id,
      email: user.email,
    },
    parameters: {
      user_name: user.name,
      dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL}${ROUTES.ADMIN}`,
    },
    templateId: "welcome_email",
  });
}
