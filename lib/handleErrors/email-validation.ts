import "server-only";

import disposableDomains from "disposable-email-domains";
import { resolveMx } from "dns/promises";

const MX_TIMEOUT_MS = 2_500;
const MX_TTL_MS = 60 * 60 * 1_000; 
const MX_CACHE_MAX = 1_000;

type CachedResult = { ok: boolean; expiresAt: number };
const mxCache = new Map<string, CachedResult>();

function getCached(domain: string): boolean | null {
  const entry = mxCache.get(domain);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    mxCache.delete(domain);
    return null;
  }
  return entry.ok;
}

function setCached(domain: string, ok: boolean): void {
  if (mxCache.size >= MX_CACHE_MAX) {
    const firstKey = mxCache.keys().next().value;
    if (firstKey) mxCache.delete(firstKey);
  }
  mxCache.set(domain, { ok, expiresAt: Date.now() + MX_TTL_MS });
}

async function hasMX(domain: string): Promise<boolean> {
  const cached = getCached(domain);
  if (cached !== null) return cached;

  const timeout = new Promise<boolean>((resolve) =>
    setTimeout(() => resolve(false), MX_TIMEOUT_MS),
  );

  const lookup = (async () => {
    try {
      const records = await resolveMx(domain);
      return records.length > 0;
    } catch {
      return false;
    }
  })();

  const ok = await Promise.race([lookup, timeout]);
  setCached(domain, ok);
  return ok;
}


export async function isValidateEmail(email: string): Promise<string | null> {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) {
    return "Please provide a valid email address.";
  }

  if (disposableDomains.includes(domain)) {
    return "Disposable emails not allowed";
  }

  const mx = await hasMX(domain);
  if (!mx) {
    return "Email domain not valid";
  }

  return null;
}
