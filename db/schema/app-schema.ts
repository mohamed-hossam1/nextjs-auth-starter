// Reserved for future application-domain tables. Not currently in use.
//
// Why this file exists:
//   `db/schema.ts` re-exports both `./schema/auth-schema` (the better-auth
//   tables) and `./schema/app-schema`. Removing the file would require
//   updating drizzle migrations metadata, so we keep an inert placeholder
//   here until the first real domain table is added.
export {};
