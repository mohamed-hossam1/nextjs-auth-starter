import { headers } from "next/headers";

import { auth } from "@/lib/auth";

import { ForbiddenError, UnauthorizedError } from "./errors";

import type { AuthUser } from "./types";

type RawAuthSession = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;

export async function getAuthSession(): Promise<RawAuthSession | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.session || !session.user) {
    return null;
  }

  return session;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getAuthSession();

  if (!session) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    role: "USER",
    // role: session.user.role ?? "USER",
  };
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new UnauthorizedError();
  }

  return user;
}

export async function requireRole(
  roles: AuthUser["role"][],
): Promise<AuthUser> {
  const user = await requireUser();

  if (!roles.includes(user.role)) {
    throw new ForbiddenError();
  }

  return user;
}
