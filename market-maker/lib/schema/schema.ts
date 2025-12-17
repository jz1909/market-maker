import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";

// Define your tables here

export const users = pgTable('users', {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  displayName: text("display_name"),
  createdAt: timestamp("created_at",{withTimezone: true}).notNull().defaultNow(),
}

)