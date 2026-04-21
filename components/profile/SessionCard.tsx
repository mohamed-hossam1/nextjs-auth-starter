"use client";

import {
  DeviceIcon,
  getBrowserInfo,
  getBrowserInformation,
} from "@/lib/visitorInfo/browserInfo";
import type { PublicSession } from "@/lib/auth-helpers";
import { cn, formatDate } from "@/lib/utils";

export default function SessionCard({
  session,
  isCurrent = false,
  isRevoking,
  onRevoke,
}: {
  session: PublicSession;
  isCurrent?: boolean;
  isRevoking?: boolean;
  onRevoke?: () => void;
}) {
  const browserInfo = getBrowserInfo(session.userAgent);
  const label = getBrowserInformation(browserInfo);
  const signedInAt = session.createdAt
    ? formatDate(new Date(session.createdAt))
    : null;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-none border bg-card px-3 py-3 transition-colors",
        isCurrent
          ? "border-foreground border-l-4 border-l-accent"
          : "border-border",
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-none border",
          isCurrent
            ? "border-foreground bg-foreground text-background"
            : "border-border bg-background text-foreground/70",
        )}
        aria-hidden="true"
      >
        <DeviceIcon device={browserInfo.device} className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-serif-body text-sm text-foreground">
            {label}
          </p>
          {isCurrent && (
            <span className="inline-flex items-center bg-accent px-1.5 py-[3px] font-mono text-[10px] tracking-[0.06em] uppercase text-accent-foreground">
              Current
            </span>
          )}
        </div>
        {signedInAt && (
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Signed in · {signedInAt}
          </p>
        )}
      </div>

      {!isCurrent && onRevoke && (
        <button
          type="button"
          aria-label={`Revoke session: ${label}`}
          onClick={onRevoke}
          disabled={isRevoking}
          className="shrink-0 cursor-pointer self-start rounded-none border border-destructive bg-transparent px-2 py-1 font-mono text-[10px] tracking-[0.18em] uppercase text-destructive transition-colors hover:bg-destructive hover:text-background disabled:pointer-events-none disabled:opacity-50"
        >
          {isRevoking ? "Revoking…" : "Revoke"}
        </button>
      )}
    </div>
  );
}
