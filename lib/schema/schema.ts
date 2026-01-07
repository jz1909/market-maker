import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  pgEnum,
  numeric,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================================
// ENUMS
// ============================================================================

export const gameStatusEnum = pgEnum("game_status", [
  "LOBBY",
  "ACTIVE",
  "FINISHED",
]);
export const roundStatusEnum = pgEnum("round_status", [
  "PENDING",
  "LIVE",
  "ENDED",
  "SETTLED",
]);
export const sideStatusEnum = pgEnum("side_status", ["BUY", "SELL"]);

// ============================================================================
// TABLES
// ============================================================================

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  displayName: text("display_name"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  prompt: text("prompt").notNull().unique(),
  answer: numeric("answer").notNull(),
  unit: text("unit"),
  source: text("source"),
  year: integer("year"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const games = pgTable("games", {
  id: uuid("id").primaryKey().defaultRandom(),
  gameStatus: gameStatusEnum("game_status").notNull().default("LOBBY"),
  joinCode: text("join_code").unique().notNull(),
  makerUserId: uuid("maker_user_id"),
  takerUserId: uuid("taker_user_id"),
  currentRoundIndex: integer("current_round_index").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  winnerUserId: uuid("winner_user_id"),
});

export const rounds = pgTable("rounds", {
  id: uuid("id").primaryKey().defaultRandom(),
  gameId: uuid("game_id").notNull(),
  roundIndex: integer("round_index").notNull(),
  roundStatus: roundStatusEnum("round_status").notNull(),
  questionId: uuid("question_id").notNull(),
  currentTurnIndex: integer("current_turn_index").notNull().default(0),
  startedAt: timestamp("started_at", { withTimezone: true }),
  endedAt: timestamp("ended_at", { withTimezone: true }),
});

export const quotes = pgTable("quotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  roundId: uuid("round_id").notNull(),
  turnIndex: integer("turn_index").notNull(),
  makerUserId: uuid("maker_user_id").notNull(),
  bid: numeric("bid").notNull(),
  ask: numeric("ask").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const trades = pgTable("trades", {
  id: uuid("id").primaryKey().defaultRandom(),
  roundId: uuid("round_id").notNull(),
  turnIndex: integer("turn_index").notNull(),
  gameId: uuid("game_id").notNull(),
  takerUserId: uuid("taker_user_id").notNull(),
  side: sideStatusEnum("side").notNull(),
  price: numeric("price").notNull(),
  quantity: integer("quantity").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }),
});

// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  gamesAsMaker: many(games, { relationName: "gameMaker" }),
  gamesAsTaker: many(games, { relationName: "gameTaker" }),
  gamesWon: many(games, { relationName: "gameWinner" }),
  quotes: many(quotes, { relationName: "quoteMaker" }),
  trades: many(trades, { relationName: "tradeTaker" }),
}));

export const gamesRelations = relations(games, ({ one, many }) => ({
  maker: one(users, {
    fields: [games.makerUserId],
    references: [users.id],
    relationName: "gameMaker",
  }),
  taker: one(users, {
    fields: [games.takerUserId],
    references: [users.id],
    relationName: "gameTaker",
  }),
  winner: one(users, {
    fields: [games.winnerUserId],
    references: [users.id],
    relationName: "gameWinner",
  }),
  rounds: many(rounds, { relationName: "roundGame" }),
}));

export const roundsRelations = relations(rounds, ({ one, many }) => ({
  game: one(games, {
    fields: [rounds.gameId],
    references: [games.id],
    relationName: "roundGame",
  }),
  question: one(questions, {
    fields: [rounds.questionId],
    references: [questions.id],
    relationName: "roundQuestion",
  }),
  quote: many(quotes, { relationName: "quoteRound" }),
  trades: many(trades, { relationName: "tradeRound" }),
}));

export const questionsRelations = relations(questions, ({ many }) => ({
  rounds: many(rounds, { relationName: "roundQuestion" }),
}));

export const quotesRelations = relations(quotes, ({ one }) => ({
  round: one(rounds, {
    fields: [quotes.roundId],
    references: [rounds.id],
    relationName: "quoteRound",
  }),
  maker: one(users, {
    fields: [quotes.makerUserId],
    references: [users.id],
    relationName: "quoteMaker",
  }),
}));

export const tradesRelations = relations(trades, ({ one }) => ({
  round: one(rounds, {
    fields: [trades.roundId],
    references: [rounds.id],
    relationName: "tradeRound",
  }),
  taker: one(users, {
    fields: [trades.takerUserId],
    references: [users.id],
    relationName: "tradeTaker",
  }),
}));
