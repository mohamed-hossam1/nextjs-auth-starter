import "server-only";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { AppError } from "@/lib/handleErrors/error";

export type PublicSession = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
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
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    expiresAt: session.expiresAt,
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
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}


export async function getSession(): Promise<AuthenticatedContext | null> {
  const result = await auth.api.getSession({ headers: await headers() });
  if (!result?.session || !result.user) {
    return null;
  }
  return {
    session: toPublicSession(result.session),
    user: toPublicUser( result.user),
  };
}

export async function requireSession(): Promise<AuthenticatedContext> {
  const ctx = await getSession();
  if (!ctx) {
    throw new AppError("Unauthorized", 401);
  }
  return ctx;
}
