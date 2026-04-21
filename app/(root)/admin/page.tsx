import { redirect } from "next/navigation";
import { Suspense } from "react";

import SessionActions from "@/components/SessionActions";
import { SessionActionsSkeleton } from "@/components/skeletons/SessionActionsSkeleton";
import { ROUTES } from "@/constants/routes";
import { getSession } from "@/lib/auth-helpers";

/**
 * Server-side authentication guard for the admin route.
 *
 * Why this matters even though we also have `proxy.ts`:
 *  - Defense in depth. The proxy is the first line; this is the last line.
 *  - The proxy uses cookie inspection only (no DB hit) — that catches
 *    "no cookie at all" but not "cookie present but expired/revoked". The
 *    server component re-validates against the actual session store.
 *  - Future server components on this page will read user-scoped data; if
 *    we ever forget to add an auth check there, this redirect prevents the
 *    page from rendering with a missing session in the first place.
 */
export default async function AdminPage() {
  const session = await getSession();
  if (!session) {
    redirect(ROUTES.LOGIN);
  }

  return (
    <div className="min-h-screen w-full bg-background">
      <header className="flex items-center justify-between border-b border-foreground px-6 py-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          mocode · admin
        </p>
        <Suspense fallback={<SessionActionsSkeleton />}>
          <SessionActions />
        </Suspense>
      </header>

      <main className="px-6 py-8">
        <h1 className="font-serif-display italic text-3xl text-title leading-tight tracking-[-0.005em]">
          Admin
        </h1>
        <p className="mt-2 font-serif-body italic text-sm text-subtitle max-w-[70ch]">
          Click your avatar in the top right to manage your profile, security,
          and active sessions.
        </p>
      </main>
    </div>
  );
}
