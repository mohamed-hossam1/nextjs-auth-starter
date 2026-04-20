"use client";

import { getCurrentSession } from "@/actions/profile";
import { sessionQueryKey } from "@/lib/reactQuery/query-keys";
import type { ActionResult } from "@/types/global";
import type { Session, User } from "better-auth";
import { useQuery } from "@tanstack/react-query";

export type SessionPayload = {
  session: Session;
  user: User;
};

export type SessionQueryData = ActionResult<SessionPayload | null>;

export function useSession() {
  return useQuery<SessionQueryData>({
    queryKey: sessionQueryKey,
    queryFn: async () => {
      const res = await getCurrentSession();
      return res;
    },
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
