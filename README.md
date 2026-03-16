# collab-test

A full-stack monorepo built with modern web technologies.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vite · React 19 · TypeScript |
| **UI** | Tailwind CSS · shadcn/ui components |
| **Forms** | Formik · Yup |
| **Data fetching** | TanStack React Query |
| **Analytics** | PostHog |
| **Backend** | Hono on Cloudflare Workers |
| **ORM** | DrizzleORM |
| **Database** | NeonDB (serverless PostgreSQL) |
| **Object Storage** | Cloudflare R2 |
| **Queue** | Cloudflare Queue |

## Project Structure

```
collab-test/
├── packages/
│   ├── frontend/          # Vite + React + TypeScript app
│   │   ├── src/
│   │   │   ├── components/  # Reusable UI components (shadcn/ui style)
│   │   │   ├── hooks/       # React Query data hooks
│   │   │   ├── lib/         # Utilities (api client, posthog, utils)
│   │   │   └── pages/       # Route-level page components
│   │   ├── vite.config.ts
│   │   └── tailwind.config.js
│   └── backend/           # Hono API on Cloudflare Workers
│       ├── src/
│       │   ├── db/          # DrizzleORM schema and client
│       │   ├── routes/      # API route handlers
│       │   └── index.ts     # Hono app + queue consumer
│       ├── wrangler.toml
│       └── drizzle.config.ts
└── package.json           # npm workspaces root
```

## Prerequisites

- Node.js 20+
- A [NeonDB](https://neon.tech) project
- A [Cloudflare](https://cloudflare.com) account with Workers enabled
- A [PostHog](https://posthog.com) project (optional – for analytics)

## Getting Started

### 1. Clone and install dependencies

```bash
git clone https://github.com/aristoavilla/collab-test
cd collab-test
npm install
```

### 2. Configure the backend

```bash
cp packages/backend/.env.example packages/backend/.env
# Edit .env and fill in DATABASE_URL

# Set secrets in Cloudflare (for production)
cd packages/backend
npx wrangler secret put DATABASE_URL
npx wrangler secret put POSTHOG_API_KEY

# Generate & run database migrations
npm run db:generate -w packages/backend
npm run db:migrate -w packages/backend
```

### 3. Configure the frontend

```bash
cp packages/frontend/.env.example packages/frontend/.env.local
# Edit .env.local and fill in VITE_POSTHOG_API_KEY
```

### 4. Create Cloudflare R2 bucket and Queue

```bash
cd packages/backend
npx wrangler r2 bucket create collab-test-storage
npx wrangler r2 bucket create collab-test-storage-preview
npx wrangler queues create collab-test-tasks
```

### 5. Run in development

In one terminal, start the backend:
```bash
npm run dev:backend
# Backend runs at http://localhost:8787
```

In another terminal, start the frontend:
```bash
npm run dev:frontend
# Frontend runs at http://localhost:5173
# /api/* requests are proxied to the backend automatically
```

### 6. Deploy

```bash
# Deploy backend to Cloudflare Workers
npm run deploy:backend

# Build frontend (deploy to Cloudflare Pages, Vercel, etc.)
npm run build:frontend
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/users` | List all active users |
| POST | `/api/users` | Create a user |
| GET | `/api/users/:id` | Get user with their items |
| PATCH | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Soft-delete user |
| GET | `/api/items` | List all items |
| POST | `/api/items` | Create an item |
| GET | `/api/items/:id` | Get item (increments view count via Queue) |
| PATCH | `/api/items/:id` | Update item |
| DELETE | `/api/items/:id` | Delete item (removes R2 attachment) |
| POST | `/api/items/:id/upload` | Upload a file to R2 |
| GET | `/api/storage/:key` | Retrieve file from R2 |

## Database

The schema lives in `packages/backend/src/db/schema.ts`. Migrations are managed with `drizzle-kit`:

```bash
# Generate a new migration after schema changes
npm run db:generate

# Apply pending migrations to NeonDB
npm run db:migrate

# Open DrizzleORM Studio (GUI for NeonDB)
npm run db:studio
```
