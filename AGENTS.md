# Repository Guidelines

## Project Structure & Module Organization
`src/app` contains Next.js App Router routes plus colocated loaders, actions, and UI; keep route groups small (e.g., `(global)/wiki`, `campaigns/[id]`). Shared UI primitives live in `src/components`, and cross-cutting data helpers, Drizzle schema, and validation belong in `src/lib`. SQL snapshots and migrations sit in `drizzle/` and `migrations/`, while large seed data stays in `database/`. Use `public/` for static assets and `docs/` for design or UX specs.

## Build, Test, and Development Commands
- `npm run dev` (or `make dev`) starts the hot-reload server against the local SQLite database.
- `npm run build` compiles production assets; `npm run start` serves them and mirrors the Docker entrypoint.
- `npm run lint` runs ESLint with Next/React rules; keep it clean before pushing.
- `npm run format` applies Prettier to touched files.
- `npm run init-db` seeds baseline data, and `npm run migrate` replays Drizzle migrations pulled from `migrations/`.

## Coding Style & Naming Conventions
The codebase is strict TypeScript with ES modules, 2-space indentation, and semicolons. Components are functional, typed with inference-friendly props, and use server actions that return serializable payloads. Hooks use the `useThing` pattern, utilities use `get`/`build` prefixes, and route folders use kebab-case while component files use PascalCase. Tailwind class strings roughly follow layout → spacing → typography ordering. Always run Prettier + ESLint after edits.

## Testing Guidelines
No automated test runner is configured yet, so linting plus manual regression remains the gate. When touching a feature, run `npm run dev`, exercise the affected page end-to-end, and watch server logs for Drizzle queries. Validate mutations via the UI or Drizzle Studio, and document risky scenarios (multi-step forms, migrations) in the PR description so reviewers know what to retest.

## Commit & Pull Request Guidelines
Stay close to the existing Conventional Commit tone (`feat:`, `fix:`, `refactor:`) with imperative subjects describing behavior. Each commit should bundle code, schema, and assets for a single feature so migrations never drift from their callers. Pull requests should summarize the user impact, list verification steps (`npm run lint`, manual page exercised), link issues, and attach screenshots or GIFs for UI work. Call out breaking schema changes or env var additions in bold so other agents can re-seed quickly.
