# 🏰 Greedy — A Modern D&D Campaign Manager

_Organize your worlds, characters, and adventures — all in one elegant app._

Greedy is a full-stack Next.js application that helps Dungeon Masters run richly-documented campaigns. Track adventures, characters, quests, diaries, magic items, relationships, sessions, wiki lore, and media uploads from a single dashboard.

## ✨ Key Features
- **Campaign & Adventure Management** with timelines, status tracking, and nested sessions
- **Character Sheets & Diaries** including equipment, stats, relationships, and narrative journals
- **Quest, Location, and Magic Item tracking** with tagging, ownership, and priority workflows
- **Session logging & wiki integration** for Open5e and AD&D 2e content with searchable references
- **Image galleries & entity linking** for campaigns, characters, adventures, and locations
- **Server Actions + Drizzle ORM** for type-safe mutations backed by SQLite

## 🛠️ Tech Stack
- **Framework:** Next.js 15 (App Router) with React 19 Server/Client Components
- **Language & Tooling:** TypeScript, ESLint, Prettier, TailwindCSS + DaisyUI, Lucide, Recharts
- **Data:** SQLite (Better SQLite3) with Drizzle ORM & SQL migrations
- **Validation & Forms:** Zod, React Hook Form, custom form primitives
- **DevOps:** Docker, Makefile targets, Drizzle Kit, local file storage for uploads

## 📁 Project Structure
```
greedy/
├── src/
│   ├── app/                 # App Router routes, API handlers, server actions
│   ├── components/          # UI primitives + feature components
│   ├── lib/
│   │   ├── actions/         # Server actions per entity
│   │   ├── db/              # Drizzle schema & DB helpers
│   │   ├── forms/           # Form schemas + components
│   │   └── hooks/           # Shared hooks (e.g., diary filters)
│   └── styles/…             # Global styles, Tailwind config
├── drizzle/                 # Generated SQL migrations + journal
├── migrations/              # Hand-written SQL fixes & utilities
├── database/                # SQLite storage (gitignored, ships with .gitkeep)
├── public/                  # Static assets + uploads (images folder is empty by default)
├── docs/                    # UX notes, runbooks, and feature guides
├── scripts/                 # Tooling for DB init, diagnostics, legacy migrations
├── Dockerfile & docker-compose*.yml
├── Makefile
└── package.json
```

## ✅ Requirements
- Node.js **20.x** and npm **10.x**
- SQLite 3 CLI (optional but useful for verification)
- macOS/Linux shell tools (`bash`, `sed`, `sqlite3`, etc.)
- Docker Desktop 24+ (optional for container workflows)

## 🚀 Setup
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Create your environment file**
   ```bash
   cp .env.example .env.local
   ```
3. **Prepare storage directories (already tracked via `.gitkeep`, but safe to re-create)**
   ```bash
   mkdir -p database public/images
   ```
4. **Apply database migrations (recreates `database/campaign.db` from `drizzle/`)**
   ```bash
   npm run migrate
   ```
5. **Seed baseline data (default D&D 5e edition, sanity checks)**
   ```bash
   npm run init-db
   ```
6. **Start the dev server**
   ```bash
   npm run dev
   # or
   make dev
   ```
7. Visit `http://localhost:3000` (configurable via `NEXT_PUBLIC_APP_URL`).

_Tested flow_: clone → `npm install` → `npm run migrate` → `npm run init-db` → `npm run dev`.

## 🌱 Environment Variables
All secrets live outside version control. Copy `.env.example` and adjust as needed.

| Variable | Description | Default |
| --- | --- | --- |
| `DATA_DIR` | Path (resolved from project root) where SQLite files live | `./database` |
| `NEXT_PUBLIC_APP_URL` | Public app origin used by Next.js & share links | `http://localhost:3000` |
| `NEXT_TELEMETRY_DISABLED` | Disables Next.js telemetry | `1` |
| `NODE_ENV` | Build/runtime mode | `development` |

## 🗄️ Database & Seed Data
- **Schema definition:** `src/lib/db/schema.ts`
- **Migrations:** SQL snapshots in `drizzle/` (managed by Drizzle Kit)
- **Database file:** `database/campaign.db` (gitignored; a `.gitkeep` stands in its place)
- **Commands:**
  ```bash
  # Apply all migrations to the configured DATA_DIR
  npm run migrate

  # Insert baseline reference data (safe to rerun)
  npm run init-db

  # Reset from scratch
  rm -f database/campaign.db
  npm run migrate && npm run init-db

  # Inspect tables (optional)
  sqlite3 database/campaign.db ".tables"
  ```
- **Legacy data:** `npm run migrate:legacy` runs `scripts/migrate-from-backend.ts` if you still have an older sqlite dump in `../backend/data/campaign.db`.

## 🖼️ Media Storage
- Uploads are stored under `public/images/<entity-type>/<files>`.
- The folder is tracked only via `public/images/.gitkeep`; actual images are ignored so no personal art ships with the repo.
- For Docker deployments mount a persistent volume to `/app/public/images` (already configured in `docker-compose.yml`).

## 📦 Common Commands
| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Next.js with hot reload |
| `npm run build` / `npm run start` | Production build & serve |
| `npm run lint` | ESLint (Next.js + React rules) |
| `npm run format` | Prettier on the repo |
| `npm run migrate` | Apply Drizzle migrations to `database/campaign.db` |
| `npm run init-db` | Seed baseline data (idempotent) |
| `npm run migrate:legacy` | Optional data import from the previous backend |
| `make dev`, `make build`, … | Convenience wrappers for the most common npm tasks |

## 🐳 Docker & Deployment
### Local containers
```bash
docker compose -f docker-compose.dev.yml --profile dev up --build
```
Mounts the repo into the container for live reload. The SQLite file lives at `./database` on the host so it survives restarts.

### Production compose
```bash
docker compose up --build -d
```
This uses `docker-compose.yml`, maps `./database` and `./public/images` into the container, and exposes port `3001` → `3000`. Update `NEXT_PUBLIC_APP_URL` before building images.

### Dockerfile targets
- `development` — used by `docker-compose.dev.yml`
- `builder` + `runner` — multi-stage pipeline with Better-SQLite3 rebuild and standalone Next.js output

## 🔒 Public Release Checklist
- ✅ `.env` files are ignored; only `.env.example` documents required vars
- ✅ `database/` and `public/images/` contain only `.gitkeep` placeholders
- ✅ `.gitignore` blocks `/uploads`, `/public/uploads`, `/tmp`, `/dist`, `/build`, `/coverage`, `*.db`, etc.
- ✅ No personal paths, API keys, or credentials remain in config/docs
- ✅ README documents clone → install → migrate → seed → run flow
- ✅ Docker volumes now mount relative paths suitable for any machine

## 🔄 Development Workflow

### Code Quality Commands
```bash
npm run lint        # ESLint
npx tsc --noEmit    # Type check
npm run migrate     # Apply schema changes
npm run init-db     # Seed defaults
```

### Form Handling Best Practices
```typescript
"use server";
export async function createAdventure(
  prevState: { success: boolean; error?: string },
  formData: FormData,
) {
  const validation = validateFormData(AdventureFormSchema, {/* ... */});
  if (!validation.success) return { success: false, error: validation.errors };
  // mutate with server action
}
```

### Component Patterns
- Use `useActionState` for optimistic form submissions
- Wrap upload flows with `ImageManager` to centralize validation
- Validate on both client + server via shared Zod schemas (`src/lib/forms/schemas.ts`)

## 🏗️ Architecture Highlights
- **Server Components** fetch sensitive data close to the DB
- **Client Components** handle live interactivity (image carousel, force graph, etc.)
- **Server Actions** perform all mutations and return serializable payloads
- **Campaign-Scoped Data** ensures isolation between players and worlds

## 🚢 Deployment & Maintenance
- Build locally: `npm run build`
- Run production server: `npm run start`
- Back up the SQLite file regularly: `cp database/campaign.db database/campaign.db.backup.$(date +%s)`
- Monitor Docker logs: `docker logs greedy_app`

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feat/my-change`)
3. Keep changes focused (code + schema + docs together)
4. Run `npm run lint` and manually test affected flows
5. Open a PR with user impact, verification steps, and screenshots for UI tweaks

## 📄 License
MIT © Greedy contributors

---

**Built with ❤️ for the D&D community.**
