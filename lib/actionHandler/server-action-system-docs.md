# Server Action System

A thin wrapper around Next.js Server Actions that gives every action:

- ✅ Automatic input validation via Zod
- ✅ Structured success / error responses (no more `try/catch` in every action)
- ✅ Auth checks built-in (`protectedAction`, `adminAction`)
- ✅ Automatic logging with timing per action

---

## File Structure

```
lib/actionHandler/
  ├── create-action.ts   ← Everything: validation, error handling, logging, builders
  ├── errors.ts          ← All error classes (ValidationError, NotFoundError, …)
  ├── types.ts           ← TypeScript types used across the system
  ├── auth.ts            ← Session helpers (requireUser, getCurrentUser, …)
  ├── better-auth-error.ts ← Helper for better-auth API errors specifically
  └── logger.ts          ← Console logging with timestamps
```

---

## Quick Start

Every action must live in a `"use server"` file and follow this pattern:

```ts
"use server";

import { protectedAction } from "@/lib/actionHandler/create-action";
import { z } from "zod";

export const createPost = protectedAction({
  name: "posts.create",                  // used in logs
  input: z.object({ title: z.string() }),
}).action(async ({ input, ctx }) => {
  // input is fully typed from your Zod schema
  // ctx.user is guaranteed non-null here (protectedAction)
  return await db.insert(posts).values({ title: input.title, userId: ctx.user.id });
});
```

The returned function always has this shape — no matter what:

```ts
// ✅ Success
{ success: true, data: <your return value> }

// ❌ Failure (validation, auth, db error, …)
{ success: false, error: { code: "VALIDATION_ERROR", message: "…", fields?: { … } } }
```

---

## The Three Builders

Pick the right builder based on who can call the action:

| Builder | Who can call it | `ctx.user` inside handler |
|---|---|---|
| `publicAction` | Anyone (no login needed) | `null` |
| `protectedAction` | Logged-in users only | `AuthUser` (never null) |
| `adminAction` | Admins only (`role === "ADMIN"`) | `AuthUser` (never null) |

```ts
import { publicAction, protectedAction, adminAction } from "@/lib/actionHandler/create-action";
```

---

## Options

All three builders accept the same options:

```ts
{
  name: string;          // Required. Shows up in server logs.
  input?: z.ZodSchema;  // Optional. If provided, input is validated automatically.
  output?: z.ZodSchema; // Optional. If provided, output is validated before returning.
  middlewares?: [...];  // Optional. Custom async checks that run before your handler.
}
```

---

## Handling Errors in Your Action

Throw any error from `errors.ts` — the system catches it and converts it to a structured failure automatically.

```ts
import { NotFoundError, BadRequestError, ValidationError } from "@/lib/actionHandler/errors";

export const getPost = protectedAction({
  name: "posts.get",
  input: z.object({ id: z.string() }),
}).action(async ({ input }) => {
  const post = await db.query.posts.findFirst({ where: eq(posts.id, input.id) });

  if (!post) throw new NotFoundError("Post not found");

  return post;
});
```

### Available Errors

| Error class | `code` sent to client | Exposed to client? |
|---|---|---|
| `BadRequestError` | `BAD_REQUEST` | ✅ Yes |
| `ValidationError` | `VALIDATION_ERROR` | ✅ Yes (+ `fields`) |
| `UnauthorizedError` | `UNAUTHORIZED` | ✅ Yes |
| `ForbiddenError` | `FORBIDDEN` | ✅ Yes |
| `NotFoundError` | `NOT_FOUND` | ✅ Yes |
| `RateLimitError` | `RATE_LIMITED` | ✅ Yes |
| `DatabaseError` | `DATABASE_ERROR` | ❌ Hidden ("Something went wrong") |
| `InternalServerError` | `INTERNAL_SERVER_ERROR` | ❌ Hidden ("Something went wrong") |

> **Drizzle errors are handled automatically.** PostgreSQL codes like `23505` (duplicate), `23503` (bad reference), `23502` (null violation) are caught and converted to a `ValidationError` without any extra code on your part.

---

## Reading the Result on the Client

```ts
"use client";

import { createPost } from "@/actions/posts";

async function handleSubmit(formData: FormData) {
  const result = await createPost({ title: formData.get("title") as string });

  if (!result.success) {
    // result.error.code  → e.g. "VALIDATION_ERROR"
    // result.error.message → human-readable message
    // result.error.fields  → { title: ["Too short"] } (only for validation errors)
    console.error(result.error.message);
    return;
  }

  // result.data → your return value, fully typed
  console.log("Created:", result.data);
}
```

---

## Adding Custom Middleware

Middlewares run **after** the auth check but **before** your handler. Use them for extra checks that multiple actions share.

```ts
import { protectedAction } from "@/lib/actionHandler/create-action";
import { ForbiddenError } from "@/lib/actionHandler/errors";

// Example: only allow the owner of a resource to modify it
const ownerOnly = async ({ input, ctx }) => {
  const resource = await db.query.posts.findFirst({ where: eq(posts.id, input.id) });
  if (resource?.userId !== ctx.user?.id) throw new ForbiddenError();
};

export const deletePost = protectedAction({
  name: "posts.delete",
  input: z.object({ id: z.string() }),
  middlewares: [ownerOnly],
}).action(async ({ input }) => {
  await db.delete(posts).where(eq(posts.id, input.id));
});
```

---

## Using with better-auth API calls

For actions that call `auth.api.*`, use `betterAuthError` to normalize better-auth's own errors into the same structured format:

```ts
import { betterAuthError } from "@/lib/actionHandler/better-auth-error";

export const updateProfile = protectedAction({
  name: "profile.updateProfile",
  input: z.object({ name: z.string() }),
}).action(async ({ input }) => {
  try {
    return await auth.api.updateUser({ headers: await headers(), body: { name: input.name } });
  } catch (error) {
    throw betterAuthError(error, "profile:updateProfile");
  }
});
```

The second argument (`"profile:updateProfile"`) is just a label for the server log.
