# Fooswins

A standalone foosball leaderboard built with React, Vite and Cloudflare Workers/D1. It runs independently of ChatGPT.

Website: https://fooswins.nolankha.workers.dev

## Features

- Public singles and doubles match entry, with optional 0–10 integer scores.
- Persistent player and team standings, match history and individual head-to-head records.
- All-time and visitor-local-day filters; format-specific win rates after ten matches.
- Unicode name normalization and explicit aliases.
- Server-validated, rate-limited admin rename and deletion commands.

Matches are stored in D1 separately from the source code. Publishing updated code preserves the database.

## Setup

Install Node.js 22 or newer and run `npm ci`.

Configure these private build environment variables in Cloudflare:

- `CLOUDFLARE_ACCOUNT_ID`: the deployment account ID.
- `FOOSWINS_DATABASE_ID`: the UUID of the existing production D1 database.

These identifiers are intentionally excluded from public source. `scripts/configure.mjs` generates a local, Git-ignored `wrangler.deploy.jsonc` from them. It refuses to deploy if they are missing, preventing accidental connection to a new or incorrect database.

Set `ADMIN_PASSCODE` as a Worker runtime secret, never as a client-side or public configuration value. You can set it interactively after generating the private deployment configuration:

```sh
node scripts/configure.mjs
npx wrangler secret put ADMIN_PASSCODE --config wrangler.deploy.jsonc
```

## Automatic GitHub publishing

In Cloudflare Workers & Pages, select `fooswins`, then Settings > Builds > Connect. Authorize Cloudflare's GitHub integration for this repository and select:

- Production branch: `main`
- Root directory: `/`
- Build command: `npm ci && npm run build`
- Deploy command: `npm run publish`

Add the private build variables listed above. Cloudflare handles its deployment credential during setup; never commit API tokens. Once connected, commits to `main` publish automatically. Until then, code changes do not automatically update the live site.

## Manual deployment

Authenticate with Wrangler and set the private environment variables above, then run:

```sh
npm run deploy
```

Append schema changes to `migrations/`. Apply pending production schema migrations with `npm run db:migrate`. Do not put data backups or production match exports in this public repository.

## Development and tests

- `src/App.tsx`: interface and dialogs.
- `src/style.css`: responsive styles.
- `src/api.ts`: server validation, database access and protected admin commands.
- `src/game.ts`: identity normalization, standings and records.
- `scripts/build-worker.mjs`: packages the client and API into a standalone Worker.

```sh
npm run types
npx tsc --noEmit
TEST_ADMIN_SECRET=test-only npm test
npm run build
```

For local preview, copy `.dev.vars.example` to `.dev.vars` and choose a test passcode. Apply local migrations with `npx wrangler d1 migrations apply fooswins --local`, build, and run `npm run preview`. Local previews use a separate database.
