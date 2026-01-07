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

## Game Rules & Flow

### Game Structure

- **1 Game = 3 Rounds**
- **1 Round = 3 Turns**
- Each round focuses on a single trivia question
- Roles (Maker/Taker) do NOT switch during the game

### Turn Flow

Each turn within a round:

1. **Maker** submits a quote (bid/ask spread)
2. **Taker** decides to BUY (hit ask), SELL (hit bid), or PASS
3. Trade is recorded, turn ends
4. Repeat for 3 turns total per round

### Round Flow

1. Round starts with a random question displayed to both players
2. 3 turns are played (maker quotes, taker trades)
3. After 3 turns, the correct answer is revealed
4. P&L is calculated for all trades in that round
5. Move to next round (or end game after round 3)

### Scoring

- P&L is hidden until the end of each round (after all 3 turns complete)
- P&L is calculated per trade based on trade price vs correct answer
- If taker BUYS at price P and answer is A: Taker P&L = (A - P), Maker P&L = (P - A)
- If taker SELLS at price P and answer is A: Taker P&L = (P - A), Maker P&L = (A - P)
- Total score = sum of all P&L across all trades in all rounds
