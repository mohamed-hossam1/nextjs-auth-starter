# Production Server Actions System Documentation

## Overview

This system provides a production-grade architecture for Next.js Server Actions with:

- Typed responses
- Structured errors
- Zod validation
- Better Auth integration
- Middleware support
- Output sanitization
- Structured logging
- Drizzle-ready error handling
- Role-based access control
- Production-safe error exposure

---

# Folder Structure

```txt
src/lib/actions/

errors.ts
types.ts
auth.ts
logger.ts
validation.ts
error-handler.ts
create-action.ts

builders/
  public-action.ts
  protected-action.ts
  admin-action.ts

middlewares/
  auth-middleware.ts
  role-middleware.ts

utils/
  create-validation-error.ts
  sanitize-output.ts

schemas/
  action-error-schema.ts
  validation-error-schema.ts
```

---

# Core Concepts

## Public Action

Accessible without authentication.

Example:

- newsletter subscription
- contact form
- login
- register

---

## Protected Action

Requires authenticated user.

Example:

- create post
- update profile
- create comment

---

## Admin Action

Requires ADMIN role.

Example:

- delete users
- moderation
- analytics dashboard

---

# Response Format

Every action returns a standardized shape.

## Success Response

```ts
{
  success: true,
  data: {
    ...
  }
}
```

---

## Error Response

```ts
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid input"
  }
}
```

---

# Error Codes

---

## BAD_REQUEST

Request logic is invalid.

Example:

```ts
{
  success: false,
  error: {
    code: "BAD_REQUEST",
    message: "Post is already archived"
  }
}
```

---

## VALIDATION_ERROR

Input validation failed.

Example:

```ts
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid input",
    fields: {
      email: ["Invalid email"]
    }
  }
}
```

---

## UNAUTHORIZED

User is not authenticated.

Example:

```ts
{
  success: false,
  error: {
    code: "UNAUTHORIZED",
    message: "Unauthorized"
  }
}
```

---

## FORBIDDEN

User is authenticated but lacks permissions.

Example:

```ts
{
  success: false,
  error: {
    code: "FORBIDDEN",
    message: "You do not have permission to perform this action"
  }
}
```

---

## NOT_FOUND

Requested resource does not exist.

Example:

```ts
{
  success: false,
  error: {
    code: "NOT_FOUND",
    message: "Post not found"
  }
}
```

---

## RATE_LIMITED

Too many requests.

Example:

```ts
{
  success: false,
  error: {
    code: "RATE_LIMITED",
    message: "Too many requests. Please try again later."
  }
}
```

---

## DATABASE_ERROR

Database/internal failure.

Public message is sanitized.

Example:

```ts
{
  success: false,
  error: {
    code: "DATABASE_ERROR",
    message: "Database operation failed"
  }
}
```

---

## INTERNAL_SERVER_ERROR

Unexpected server failure.

Example:

```ts
{
  success: false,
  error: {
    code: "INTERNAL_SERVER_ERROR",
    message: "Something went wrong"
  }
}
```

# Database Setup

## Example Drizzle Schema

```ts
// src/db/schema/posts.ts

import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),

  title: text("title").notNull(),

  content: text("content").notNull(),

  authorId: text("author_id").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

# CREATE Example

## Server Action

```ts
"use server";

import { z } from "zod";

import { db } from "@/db";

import { posts } from "@/db/schema/posts";

import { protectedAction } from "@/lib/actions/builders/protected-action";

const input = z.object({
  title: z.string().min(3),

  content: z.string().min(10),
});

const output = z.object({
  id: z.string(),

  title: z.string(),

  content: z.string(),

  authorId: z.string(),
});

export const createPost = protectedAction({
  name: "create-post",

  input,

  output,
}).action(async ({ input, ctx }) => {
  const [post] = await db
    .insert(posts)
    .values({
      title: input.title,

      content: input.content,

      authorId: ctx.user!.id,
    })
    .returning();

  return post;
});
```

---

## Frontend Usage

```tsx
"use client";

import { createPost } from "@/actions/posts/create-post";

async function handleSubmit() {
  const result = await createPost({
    title: "Redis Guide",

    content: "Production caching guide",
  });

  if (!result.success) {
    console.log(result.error);

    return;
  }

  console.log(result.data);
}
```

---

## Possible Errors

### Validation Error

```ts
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid input",
    fields: {
      title: [
        "String must contain at least 3 character(s)"
      ]
    }
  }
}
```

---

### Unauthorized Error

```ts
{
  success: false,
  error: {
    code: "UNAUTHORIZED",
    message: "Unauthorized"
  }
}
```

---

# READ Example

## Get Single Post

```ts
"use server";

import { z } from "zod";

import { eq } from "drizzle-orm";

import { db } from "@/db";

import { posts } from "@/db/schema/posts";

import { publicAction } from "@/lib/actions/builders/public-action";

import { NotFoundError } from "@/lib/actions/errors";

const input = z.object({
  postId: z.string(),
});

const output = z.object({
  id: z.string(),

  title: z.string(),

  content: z.string(),

  authorId: z.string(),
});

export const getPost = publicAction({
  name: "get-post",

  input,

  output,
}).action(async ({ input }) => {
  const post = await db.query.posts.findFirst({
    where: eq(posts.id, input.postId),
  });

  if (!post) {
    throw new NotFoundError("Post not found");
  }

  return post;
});
```

---

## Frontend Usage

```tsx
const result = await getPost({
  postId: "123",
});

if (!result.success) {
  if (result.error.code === "NOT_FOUND") {
    console.log("Post not found");
  }

  return;
}

console.log(result.data);
```

---

# UPDATE Example

```ts
"use server";

import { z } from "zod";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";

import { posts } from "@/db/schema/posts";

import { protectedAction } from "@/lib/actions/builders/protected-action";

import { NotFoundError } from "@/lib/actions/errors";

const input = z.object({
  postId: z.string(),

  title: z.string().min(3),

  content: z.string().min(10),
});

export const updatePost = protectedAction({
  name: "update-post",

  input,
}).action(async ({ input, ctx }) => {
  const [post] = await db
    .update(posts)
    .set({
      title: input.title,

      content: input.content,
    })
    .where(
      and(
        eq(posts.id, input.postId),

        eq(posts.authorId, ctx.user!.id),
      ),
    )
    .returning();

  if (!post) {
    throw new NotFoundError("Post not found");
  }

  return post;
});
```

---

# DELETE Example

```ts
"use server";

import { z } from "zod";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";

import { posts } from "@/db/schema/posts";

import { protectedAction } from "@/lib/actions/builders/protected-action";

import { NotFoundError } from "@/lib/actions/errors";

const input = z.object({
  postId: z.string(),
});

export const deletePost = protectedAction({
  name: "delete-post",

  input,
}).action(async ({ input, ctx }) => {
  const [post] = await db
    .delete(posts)
    .where(
      and(
        eq(posts.id, input.postId),

        eq(posts.authorId, ctx.user!.id),
      ),
    )
    .returning();

  if (!post) {
    throw new NotFoundError("Post not found");
  }

  return {
    deleted: true,
  };
});
```

---

# Admin Action Example

```ts
"use server";

import { z } from "zod";

import { eq } from "drizzle-orm";

import { db } from "@/db";

import { users } from "@/db/schema/users";

import { adminAction } from "@/lib/actions/builders/admin-action";

const input = z.object({
  userId: z.string(),
});

export const banUser = adminAction({
  name: "ban-user",

  input,
}).action(async ({ input }) => {
  const [user] = await db
    .update(users)
    .set({
      banned: true,
    })
    .where(eq(users.id, input.userId))
    .returning();

  return user;
});
```

---

# Middleware Example

## Audit Middleware

```ts
// src/lib/actions/middlewares/audit.ts

import type { ActionMiddleware } from "@/lib/actions/types";

export const auditMiddleware: ActionMiddleware = async ({ ctx }) => {
  console.log("AUDIT:", ctx.user?.id);
};
```

---

## Usage

```ts
protectedAction({
  name: "update-profile",

  middlewares: [auditMiddleware],
});
```

---

# Output Sanitization

## Why It Matters

Never return raw database objects directly.

Bad:

```ts
return user;
```

Potentially leaks:

- password
- hashedPassword
- secretKey
- internalFlags
- adminNotes

---

## Correct Approach

```ts
const output = z.object({
  id: z.string(),
  email: z.string(),
});
```

Only public-safe fields are returned.

---

# Best Practices

## Keep Business Logic Inside Actions

Good:

```ts
return db.insert(...)
```

Bad:

```ts
try {
} catch {}
```

The framework already handles:

- errors
- validation
- auth
- logging
- response formatting

---

# Never Do This

```ts
return dbUser;
```

Without output validation.

---

# Never Throw Generic Errors

Bad:

```ts
throw new Error("failed");
```

Good:

```ts
throw new NotFoundError();
```

---

# Recommended Action Structure

```ts
"use server"

import { z } from "zod"

import {
  protectedAction,
} from "@/lib/actions/builders/protected-action"

const input = z.object({
  ...
})

const output = z.object({
  ...
})

export const myAction =
  protectedAction({
    name: "my-action",

    input,

    output,
  }).action(async ({
    input,
    ctx,
  }) => {

    return ...
  })
```

---

# Mental Model

```txt
Request
   ↓
Validate Input
   ↓
Inject Context
   ↓
Run Middlewares
   ↓
Execute Business Logic
   ↓
Sanitize Output
   ↓
Normalize Errors
   ↓
Return Typed Response
```

---

# Final Notes

This architecture is designed to:

- scale cleanly
- reduce boilerplate
- improve consistency
- improve debugging
- provide predictable behavior
- prevent accidental security leaks
- centralize infrastructure concerns

while keeping:

- business logic simple
- actions readable
- abstractions lightweight
- debugging easy
- control explicit
