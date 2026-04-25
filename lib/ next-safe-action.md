# next safe action

```ts
export async function updateUser(input) {
  // validate
  // auth
  // permissions
  // logging
  // error handling
  // rate limit
  // db
  // serialization
}

type SafeActionResult<ServerError, Schema, ShapedErrors, Data> =
	| { data: Data; serverError?: undefined; validationErrors?: undefined }        // success
	| { data?: undefined; serverError: ServerError; validationErrors?: undefined } // server error
	| { data?: undefined; serverError?: undefined; validationErrors: ShapedErrors }; // validation failure
```
---
## createSafeActionClient

```ts
import { createSafeActionClient } from "next-safe-action";
export const actionClient = createSafeActionClient();

// createSafeActionClient options
createSafeActionClient({
  // Customize how server errors are handled and what's sent to the client
  handleServerError(e) {
      console.error("Action error:", e.message);
      return "Something went wrong";
  },
});
```
---
## Input validation

```ts
const schema = z.object({
  email: z.email(),
  password: z.string().min(8,"Password must contain at least 8 character"),
});


export const loginAction = actionClient
  .inputSchema(schema)
  .action(async ({ parsedInput }) => {
    return {
      success: true,
      email: parsedInput.email,
    };
  });

// Will return 
{
  data: {
    success: true,
    email: "test@test.com"
  }
}
OR
{
  validationErrors: {
    email: {
      _errors: ["Invalid email"]
    },
    password: {
      _errors: [
        "Password must contain at least 8 character"
      ]
    }
  }
}
```
---
## Output validation

```ts
const outputSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});
export const getUser = actionClient
  .inputSchema(z.object({ userId: z.string() }))
  .outputSchema(outputSchema)
  .action(async ({ parsedInput }) => {
    const user = await db.user.findUnique({ where: { id: parsedInput.userId } });
    // TypeScript ensures this matches outputSchema
    return { id: user.id, name: user.name, email: user.email };
  });

// If the server code returns { id: 123, name: "Alice" } 
{ serverError: "Something went wrong" }

// To log this validation error
createSafeActionClient({
  handleServerError(e) {
      if (e.constructor.name === "ActionOutputDataValidationError") {
          console.error("Output validation failed:", e.message);
      }
      return "Something went wrong";
  },
});
```
---
## Middleware

```ts
// client.use(mw).inputSchema(schema).useValidated(fn).action(serverCode);

export const authClient = actionClient.use(async ({ next }) => {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Not authenticated");
  }
  // Pass user data to the next layer via ctx
  return next({ ctx: { user: session.user } });
});

.use(async ({ next, metadata }) => {
	console.log("Starting:", metadata);
	const startTime = performance.now();
	const result = await next();
	const duration = performance.now() - startTime;
	console.log(`Finished: ${metadata} in ${duration}ms`);
	return result;
})

// use before input validation, useValidated after validation

.useValidated(async ({ parsedInput, ctx, next }) => {
    const post = await db.post.findUnique({ where: { id: parsedInput.postId } });
    if (post?.authorId !== ctx.user.id) {
      throw new Error("Not your post");
    }
    return next({ ctx: { post } });
})
```
---
## Hooks

```ts
const { execute } = useAction(myAction, {
  onExecute: ({ input }) => {
    // Fires immediately when execute() is called
    console.log("Starting with input:", input);
  },
  onSuccess: ({ data, input }) => {
    // Fires when the action succeeds
    toast.success(`Created: ${data.name}`);
  },
  onError: ({ error, input }) => {
    // Fires when the action fails (validation or server error)
    if (error.validationErrors) {
      toast.error("Invalid input");
    } else if (error.serverError) {
      toast.error(error.serverError);
    }
  }
});
```
