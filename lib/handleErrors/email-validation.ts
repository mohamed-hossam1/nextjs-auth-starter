import disposableDomains from "disposable-email-domains"
import { resolveMx } from "dns/promises";

async function hasMX(domain: string): Promise<boolean> {
  try {
    const records = await resolveMx(domain);
    return records && records.length > 0;
  } catch (error) {
    return false;
  }
}

export async function isValidateEmail(email: string) {
  const domain = email.split("@")[1];

  // const allowedDomains = ["gmail.com", "yahoo.com", "outlook.com"];
  // if (!allowedDomains.includes(domain)) {
  //   return "Email domain not allowed";
  // }

  if (disposableDomains.includes(domain)) {
    return "Disposable emails not allowed";
  }

  const mx = await hasMX(domain);
  if (!mx) {
    return "Email domain not valid";
  }

  return null;
}
