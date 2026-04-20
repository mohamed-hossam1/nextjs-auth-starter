"use client";

import { getSessions, revokeSession } from "@/actions/profile";
import SessionCard from "@/components/profile/SessionCard";
import { TabsContent } from "@/components/ui/tabs";
import { getErrorMessage } from "@/lib/handleErrors/error";
import { accountSessionsQueryKey } from "@/lib/reactQuery/query-keys";
import { AlertCircle, ShieldCheck } from "lucide-react";
import type { Session } from "better-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function SessionsTabPanel({
  currentSessionToken,
  isOpen,
  isActive,
}: {
  currentSessionToken: string;
  isOpen: boolean;
  isActive: boolean;
}) {
  const queryClient = useQueryClient();

  const sessionsQuery = useQuery({
    queryKey: accountSessionsQueryKey,
    enabled: isOpen && isActive,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const result = await getSessions();

      if (!result.success) {
        throw new Error(result.message || "Failed to load active sessions.");
      }

      if (!result.data) {
        throw new Error("Failed to load active sessions.");
      }

      return result.data as Session[];
    },
  });

  const revokeSessionMutation = useMutation({
    mutationFn: async ({
      token,
      sessionId,
    }: {
      token: string;
      sessionId: string;
    }) => {
      const result = await revokeSession(token);

      if (!result.success) {
        throw new Error(result.message || "Failed to revoke the session.");
      }

      return { sessionId };
    },
    onSuccess: ({ sessionId }) => {
      queryClient.setQueryData<Session[] | undefined>(
        accountSessionsQueryKey,
        (currentSessions) =>
          currentSessions?.filter((session) => session.id !== sessionId),
      );

      toast.success("Session revoked.", { position: "top-center" });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error), {
        position: "top-center",
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: accountSessionsQueryKey });
    },
  });

  const sessions = sessionsQuery.data ?? [];
  const currentSession = sessions.find(
    (session) => session.token === currentSessionToken,
  );
  const otherSessions = sessions.filter(
    (session) => session.token !== currentSessionToken,
  );
  const revokingSessionId = revokeSessionMutation.isPending
    ? revokeSessionMutation.variables.sessionId
    : null;

  return (
    <TabsContent value="sessions" className="m-0 outline-none">
      <div className="flex flex-col gap-7 px-6 py-6">
        <div>
          <h2 className="font-serif-display italic text-2xl text-title leading-[1.1] tracking-[-0.005em]">
            Active Sessions
          </h2>
          <p className="mt-1 font-serif-body italic text-sm text-subtitle">
            Manage devices where you are currently signed in.
          </p>
        </div>

        {sessionsQuery.isPending && sessionsQuery.data === undefined && (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-16 animate-pulse rounded-none bg-muted/60"
              />
            ))}
          </div>
        )}

        {sessionsQuery.isError && (
          <div className="flex flex-col gap-3 border border-destructive bg-destructive/5 p-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle
                className="mt-0.5 h-5 w-5 shrink-0 text-destructive"
                aria-hidden="true"
              />
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-foreground">
                  Failed to load sessions
                </p>
                <p className="mt-1 font-serif-body italic text-sm text-subtitle">
                  {getErrorMessage(sessionsQuery.error)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void sessionsQuery.refetch()}
              className="shrink-0 cursor-pointer rounded-none border border-foreground bg-transparent px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] font-bold text-foreground transition-colors hover:bg-foreground hover:text-background"
            >
              Retry
            </button>
          </div>
        )}

        {!sessionsQuery.isPending &&
          !sessionsQuery.isError &&
          currentSession && (
            <div className="flex flex-col gap-2">
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                This Device
              </p>
              <SessionCard session={currentSession} isCurrent />
            </div>
          )}

        {!sessionsQuery.isPending && !sessionsQuery.isError && (
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Other Sessions
            </p>

            {otherSessions.length === 0 ? (
              <div className="flex items-center gap-3 border border-border bg-card px-3 py-3">
                <ShieldCheck
                  className="h-5 w-5 shrink-0 text-accent"
                  aria-hidden="true"
                />
                <p className="font-serif-body italic text-sm text-subtitle">
                  No other active sessions found.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {otherSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    isRevoking={revokingSessionId === session.id}
                    onRevoke={() =>
                      revokeSessionMutation.mutate({
                        token: session.token,
                        sessionId: session.id,
                      })
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </TabsContent>
  );
}
