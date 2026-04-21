"use client";

import { useQuery } from "@tanstack/react-query";

import { getCurrentSession } from "@/actions/profile";
import type { AuthenticatedContext } from "@/lib/auth-helpers";
import { sessionQueryKey } from "@/lib/reactQuery/query-keys";
import type { ActionResult } from "@/types/global";

export type SessionPayload = AuthenticatedContext;
export type SessionQueryData = ActionResult<SessionPayload | null>;

export function useSession() {
  return useQuery<SessionQueryData>({
    queryKey: sessionQueryKey,
    queryFn: () => getCurrentSession(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function getAuthenticatedSession(
  sessionData?: SessionQueryData,
): SessionPayload | null {
  if (
    !sessionData?.success ||
    !sessionData.data?.session ||
    !sessionData.data?.user
  ) {
    return null;
  }
  return sessionData.data;
}
