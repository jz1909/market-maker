import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  decimal,
  pgEnum,
  numeric,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { gameStatusEnum } from "../db";

// Define your tables here

export const users = pgTable('users', {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  displayName: text("display_name"),
  createdAt: timestamp("created_at",{withTimezone: true}).notNull().defaultNow(),
}

)

export const questions = pgTable('questions', {
  id:uuid("id").primaryKey().defaultRandom(),
  prompt: text("prompt").notNull(),
  answer: numeric("answer").notNull(),
  unit: text("unit"),
  source: text("source"),
  year:integer("year"),
  createdAt:timestamp("created_at", {withTimezone: true}).notNull().defaultNow(),

})

export const games = pgTable('games', {
  id:uuid("id").primaryKey().defaultRandom(),
  status: gameStatusEnum("status").notNull().default("LOBBY"),
  joinCode: text("join_code").unique().notNull(),
  makerUserId:uuid("maker_user_id"),
  takerUserId:uuid("taker_user_id"),
  currentRoundIndex:integer("current_round_index").notNull().default(0),
  createdAt:timestamp("created_at",{withTimezone: true}).defaultNow().notNull(),
  startedAt:timestamp("started_at",{withTimezone: true}),
  finishedAt:timestamp("finished_at",{withTimezone: true}),
  winnerUserId:uuid("winner_user_id"),
})

// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  gamesAsMaker: many(games, { relationName: "maker" }),
  gamesAsTaker: many(games, { relationName: "taker" }),
  gamesWon: many(games, { relationName: "winner" }),
}));

export const gamesRelations = relations(games, ({ one }) => ({
  maker: one(users, {
    fields: [games.makerUserId],
    references: [users.id],
    relationName: "maker",
  }),
  taker: one(users, {
    fields: [games.takerUserId],
    references: [users.id],
    relationName: "taker",
  }),
  winner: one(users, {
    fields: [games.winnerUserId],
    references: [users.id],
    relationName: "winner",
  }),
}))