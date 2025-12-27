/**
 * Import questions from JSON into the database.
 *
 * Usage:
 *   npx tsx scripts/import_questions.ts
 *   npx tsx scripts/import_questions.ts --input custom_file.json
 */

import { config } from "dotenv";
config({ path: "C:/Users/jsh27/CSProj/market-maker/market-maker/.env.local" });
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { questions } from "../lib/schema/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

interface QuestionInput {
  prompt: string;
  answer: number;
  unit: string;
  source: string;
  year: number;
}

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  let inputFile = "scripts/questions.json";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--input" || args[i] === "-i") {
      inputFile = args[i + 1] ?? inputFile;
    }
  }

  // Check DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error("Error: DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  // Check input file exists
  const fullPath = path.resolve(inputFile);
  if (!fs.existsSync(fullPath)) {
    console.error(`Error: Input file not found: ${fullPath}`);
    process.exit(1);
  }

  // Read JSON file
  const rawData = fs.readFileSync(fullPath, "utf-8");
  const questionsData: QuestionInput[] = JSON.parse(rawData);

  console.log(`Found ${questionsData.length} questions in ${inputFile}`);

  // Initialize database connection
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const q of questionsData) {
    try {
      // Check if prompt already exists
      const existing = await db
        .select({ id: questions.id })
        .from(questions)
        .where(eq(questions.prompt, q.prompt))
        .limit(1);

      if (existing.length > 0) {
        skipped++;
        continue;
      }

      // Insert new question
      await db.insert(questions).values({
        prompt: q.prompt,
        answer: String(q.answer),
        unit: q.unit,
        source: q.source,
        year: q.year,
      });

      inserted++;

      // Progress indicator every 100 questions
      if (inserted % 100 === 0) {
        console.log(`  Inserted ${inserted} questions...`);
      }
    } catch (err) {
      // Handle unique constraint violation (duplicate prompt)
      if (
        err instanceof Error &&
        err.message.includes("unique constraint")
      ) {
        skipped++;
      } else {
        errors++;
        console.error(`  Error inserting "${q.prompt}":`, err);
      }
    }
  }

  console.log("\nImport complete:");
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Skipped (duplicates): ${skipped}`);
  console.log(`  Errors: ${errors}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});