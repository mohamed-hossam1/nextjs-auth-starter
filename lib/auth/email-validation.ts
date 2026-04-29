import "server-only";

import disposableDomains from "disposable-email-domains";

export async function isValidateEmail(email: string): Promise<string | null> {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) {
    return "Please provide a valid email address.";
  }

  if (disposableDomains.includes(domain)) {
    return "Disposable emails not allowed";
  }

  return null;
}
