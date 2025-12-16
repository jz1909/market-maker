# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Market Maker is a real-time trading game built with Next.js 16, using Clerk for authentication, Drizzle ORM with PostgreSQL (Neon), and Socket.IO for real-time communication.

## Commands

```bash
# Development
npm run dev          # Start Next.js dev server (localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint

# Database (Drizzle)
npx drizzle-kit generate   # Generate migrations from schema
npx drizzle-kit migrate    # Run migrations
npx drizzle-kit push       # Push schema changes directly (dev)
npx drizzle-kit studio     # Open Drizzle Studio GUI
```

## Architecture

### Directory Structure
```
market-maker/           # Next.js app root (package.json here)
├── app/                # Next.js App Router
│   ├── api/           # API routes
│   ├── game/[gameId]/ # Dynamic game routes
│   └── layout.tsx     # Root layout with ClerkProvider
├── components/
│   └── game/          # Game-specific components
├── lib/
│   ├── db.ts          # Drizzle database client
│   ├── schema/        # Drizzle table schemas (users, games, rounds, trades, quotes)
│   ├── engine/        # Game logic engine
│   ├── state/         # State management
│   ├── realtime/      # Socket.IO server setup
│   └── utils.ts       # cn() helper for Tailwind class merging
```

Note: `drizzle.config.ts` and `middleware.ts` are in the parent directory, not inside `market-maker/`.

### Key Technologies
- **Next.js 16** with App Router and React 19
- **Clerk** for authentication (middleware configured in parent directory)
- **Drizzle ORM** with Neon PostgreSQL (`@neondatabase/serverless`)
- **Socket.IO** for real-time game updates
- **Tailwind CSS 4** with shadcn/ui (new-york style)
- **Zod** for validation

### TypeScript Configuration
Strict mode enabled with additional checks:
- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`

Path alias: `@/*` maps to project root.

### Environment Variables
Required in `.env.local`:
- `DATABASE_URL` - Neon PostgreSQL connection string
- Clerk keys (see Clerk docs)
