import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { pgEnum } from 'drizzle-orm/pg-core';
import * as schema from './schema/schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql,{ schema });


export const gameStatusEnum = pgEnum("game_status", ["LOBBY", "ACTIVE", "FINISHED"]);