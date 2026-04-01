---
name: grit
description: >
  Grit framework conventions and patterns for Go + React full-stack monorepo projects.
  Use when modifying models, handlers, routes, schemas, types, resources, or admin panel
  components in a Grit project. Automatically loaded as background knowledge.
user-invocable: false
---

# Grit Framework

Grit is a full-stack meta-framework: **Go** (Gin + GORM + PostgreSQL) + **React/Next.js** (App Router + Tailwind + shadcn/ui) in a monorepo. Think Laravel + Filament, but Go + React.

**Batteries included:** file storage (S3), email (Resend), background jobs (asynq), cron, Redis cache, AI (Claude/OpenAI), security (Sentinel), observability (Pulse), auto-generated API docs (gin-docs).

For detailed API conventions, code patterns, and service documentation, see [reference.md](reference.md).

---

## CLI Commands

`ash
# Project creation (interactive by default)
grit new myapp                        # Interactive: select architecture + frontend
grit new myapp --triple --next        # Triple monorepo with Next.js
grit new myapp --single --vite        # Single app with TanStack Router (Vite)
grit new myapp --double --vite        # Web + API with TanStack Router
grit new myapp --api                  # Go API only (no frontend)
grit new-desktop myapp                # Wails desktop app

# Code generation
grit generate resource Post --fields "title:string,content:text,published:bool"
grit generate resource Post --from post.yaml
grit generate resource Category -i    # Interactive mode

# Development
grit start                            # Start dev servers
grit sync                             # Go types → TypeScript
grit add role MODERATOR               # Injects role into 7 locations
grit migrate                          # Run GORM AutoMigrate
grit seed                             # Create admin + demo users

# Operations
grit routes                           # List all API routes
grit down                             # Enable maintenance mode (503)
grit up                               # Disable maintenance mode
grit deploy --host user@server --domain myapp.com  # Production deploy

# Updates
grit upgrade                          # Update project to latest templates
grit update                           # Update Grit CLI itself
`

### Architecture modes
- **single**: Go + embedded React SPA (go:embed, one binary)
- **double**: Turborepo with Web + API
- **triple**: Turborepo with Web + Admin + API (default)
- **api**: Go API only
- **mobile**: Turborepo with API + Expo

### Frontend options
- **next**: Next.js (SSR, App Router) — default
- **tanstack/vite**: TanStack Router + Vite (SPA, fast builds)

---

## Project Structure

`
odeta/
├── .env                          # Environment variables
├── docker-compose.yml            # PostgreSQL, Redis, MinIO, Mailhog
├── .claude/skills/grit/          # This skill — AI assistant guide
├── packages/shared/              # Zod schemas, TS types, constants
│   ├── schemas/                  # Zod validation (user.ts, etc.)
│   ├── types/                    # TypeScript interfaces
│   └── constants/                # API_ROUTES, ROLES, etc.
├── apps/
│   ├── api/                      # Go backend (Gin + GORM)
│   │   ├── cmd/server/main.go
│   │   └── internal/
│   │       ├── config/           # Loads .env
│   │       ├── database/         # GORM connection
│   │       ├── models/           # GORM models
│   │       ├── handlers/         # HTTP handlers
│   │       ├── services/         # Business logic
│   │       ├── middleware/       # Auth, CORS, logger, cache
│   │       ├── routes/           # Route registration
│   │       ├── mail/             # Email (Resend)
│   │       ├── storage/          # File storage (S3)
│   │       ├── jobs/             # Background jobs (asynq)
│   │       ├── cron/             # Scheduled tasks
│   │       ├── cache/            # Redis cache
│   │       └── ai/               # AI service
│   ├── web/                      # SaaS landing page (Next.js)
│   └── admin/                    # Filament-like admin panel
│       ├── components/           # Layout, tables, forms, widgets
│       ├── hooks/                # use-auth, use-resource, use-system
│       ├── resources/            # Resource definitions
│       └── lib/                  # defineResource(), icons
`

**Mounted dashboards** (auto-configured in routes.go):
- `/docs` — API documentation (gin-docs, OpenAPI 3.1)
- `/studio` — Database browser (GORM Studio)
- `/sentinel/ui` — Security dashboard (WAF, rate limiting)
- `/pulse` — Observability (tracing, metrics)

---

## Generating Resources

`ash
grit generate resource Post --fields "title:string,content:text,published:bool,views:int"
`

Creates **8 files** (model, service, handler, schema, types, hooks, resource def, admin page) and injects into **6 existing files** (models, routes, schemas, types, constants, resource registry) via marker comments.

### Field Types

| Type | Go | TypeScript | Form |
|------|----|-----------|------|
| `string` | `string` | `string` | Text input |
| `text` | `string` | `string` | Textarea |
| `int` / `uint` / `float` | `int` / `uint` / `float64` | `number` | Number input |
| `bool` | `bool` | `boolean` | Toggle |
| `datetime` / `date` | `*time.Time` | `string | null` | Picker |
| `richtext` | `string` | `string` | Tiptap editor |
| `slug` | `string` | `string` | Auto-generated |
| `string_array` | `JSONSlice[string]` | `string[]` | Tag input |
| `belongs_to:X` | `uint` (FK) | `number` | Relationship select |
| `many_to_many:X` | Junction table | `number[]` | Multi-select |

**Modifiers:** `:unique`, `:required`, `:optional` (append after type).

---

## Marker Comments

Grit uses marker comments to inject generated code. **Never delete these:**

`go
// grit:models          — models/user.go (AutoMigrate list)
// grit:handlers        — routes/routes.go (handler initialization)
// grit:routes:protected — routes/routes.go (protected route group)
// grit:routes:admin    — routes/routes.go (admin route group)
`

`typescript
// grit:schemas         — schemas/index.ts
// grit:types           — types/index.ts
// grit:api-routes      — constants/index.ts
// grit:resources       — resources/index.ts (imports)
// grit:resource-list   — resources/index.ts (registry array)
`

---

## Common Tasks

### Add a field to an existing resource

1. Add field to Go model (`apps/api/internal/models/<name>.go`)
2. Update handler if field needs special handling
3. Update Zod schema (`packages/shared/schemas/<name>.ts`)
4. Update TypeScript type (`packages/shared/types/<name>.ts`)
5. Update admin resource (`apps/admin/resources/<name>.ts`) — add column + form field
6. Restart API (GORM auto-migrates)

### Add a new API endpoint

1. Create/update handler in `apps/api/internal/handlers/`
2. Register route in `apps/api/internal/routes/routes.go`
3. Create React Query hook in `apps/web/hooks/` or `apps/admin/hooks/`

### Add a relationship

`go
type Post struct {
    CategoryID uint     `json:"category_id"`
    Category   Category `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
}
// In handler: query.Preload("Category").Find(&posts)
`

---

## Critical Rules

1. **Never delete marker comments** (`// grit:*`)
2. **Follow the response format** — `{ data, message }` / `{ data, meta }` / `{ error: { code, message } }`
3. **Always handle errors in Go** — never ignore with `_`
4. **Keep the folder structure** — don't move files
5. **Use React Query** for all data fetching — no raw `fetch`
6. **Use Zod** for validation — shared between frontend and backend
7. **Use Tailwind + shadcn/ui** — no custom CSS files
8. **Use App Router** — never Pages Router
