import "server-only";

import type { auth } from "@/lib/auth";
import { getAuthSession } from "@/lib/actionHandler/auth";
import { UnauthorizedError } from "@/lib/actionHandler/errors";

export type PublicSession = {
  id: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuthenticatedContext = {
  session: PublicSession;
  user: PublicUser;
};

type RawSession = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>["session"];

type RawUser = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>["user"];

export function toPublicSession(session: RawSession): PublicSession {
  return {
    id: session.id,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
    ipAddress: session.ipAddress ?? null,
    userAgent: session.userAgent ?? null,
  };
}

export function toPublicUser(user: RawUser): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    image: user.image ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function getSession(): Promise<AuthenticatedContext | null> {
  const session = await getAuthSession();
  if (!session) {
    return null;
  }
  return {
    session: toPublicSession(session.session),
    user: toPublicUser(session.user),
  };
}

export async function requireSession(): Promise<AuthenticatedContext> {
  const ctx = await getSession();
  if (!ctx) {
    throw new UnauthorizedError();
  }
  return ctx;
}
