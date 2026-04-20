import SessionActions from "@/components/SessionActions";
import { SessionActionsSkeleton } from "@/components/skeletons/SessionActionsSkeleton";
import { Suspense } from "react";

export default function AdminPage() {
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
