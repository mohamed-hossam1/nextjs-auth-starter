# Next.js + Bun Template

Use this repository as a starting point for new projects. It ships with Next.js App Router, Bun tooling, Drizzle ORM, Better Auth, Tailwind CSS, and a basic auth flow you can extend.

## Use This Template

### Option A: GitHub Template (recommended)

1. Click **Use this template** on the GitHub repo.
2. Create your new repository.
3. Clone the new repo to your machine.

### Option B: Clone and reset git history

```bash
git clone <TEMPLATE_REPO_URL> <YOUR_NEW_REPO>
cd <YOUR_NEW_REPO>
rm -rf .git
git init
git add .
git commit -m "Initial commit"
```

### Rename the project

- Update the project name in [package.json](package.json).
- Adjust metadata and docs to match your product.

## Local Setup

1. Install Bun: https://bun.sh
2. Install dependencies:

```bash
bun install
```

3. Create a local env file using the example:

```bash
cp .env.example .env.local
```

4. Update values in [.env.example](.env.example) for your environment.
5. Apply the database schema:

```bash
bun run db:push
```

6. Start the dev server:

```bash
bun run dev
```

Open http://localhost:3000 in your browser.

## Scripts

```bash
bun run dev        # Start development server
bun run build      # Create production build
bun run start      # Start production server
bun run lint       # Run ESLint
bun run db:push    # Push schema to the database
bun run db:migrate # Run migrations
```

## Project Structure

- App routes and layouts: [app](app)
- Server actions: [actions](actions)
- UI components: [components](components)
- Database schema and migrations: [db](db)
- Utilities and integrations: [lib](lib)
