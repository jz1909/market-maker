import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, games, rounds, questions } from "@/lib/schema/schema";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { startRound } from "@/lib/engine/game";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ joinCode: string }> },
) {
  const { joinCode } = await params;

  // Check auth

  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  // Get UUID

  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
  });

  if (!dbUser) {
    return NextResponse.json(
      { error: "User not in database" },
      { status: 404 },
    );
  }

  // fetch game

  const game = await db.query.games.findFirst({
    where: eq(games.joinCode, joinCode),
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  if (game.makerUserId !== dbUser.id) {
    return NextResponse.json(
      { error: "Only Maker can start the game" },
      { status: 403 },
    );
  }

  // check lobby
  if (game.gameStatus !== "LOBBY") {
    return NextResponse.json(
      { error: "Game is not in a status that can start" },
      { status: 400 },
    );
  }

  if (!game.takerUserId) {
    return NextResponse.json(
      { error: "Both players are not present" },
      { status: 400 },
    );
  }

  const [randomQuestion] = await db
    .select()
    .from(questions)
    .orderBy(sql`RANDOM()`)
    .limit(1);

  if (!randomQuestion) {
    return NextResponse.json(
      { error: "No questions available" },
      { status: 500 },
    );
  }

  const [newRound] = await db
    .insert(rounds)
    .values({
      gameId: game.id,
      roundIndex: 0,
      questionId: randomQuestion.id,
      roundStatus: "PENDING",
    })
    .returning();

  // Set round to LIVE so maker can submit quotes
  if (newRound) {
    await startRound(newRound.id);
  }

  await db
    .update(games)
    .set({
      gameStatus: "ACTIVE",
      startedAt: new Date(),
    })
    .where(eq(games.id, game.id));

  // Client-side broadcasting handles notifying the taker

  return NextResponse.json({
    success: true,
    gameId: game.id,
    roundId: newRound?.id,
    questionPrompt: randomQuestion.prompt,
    questionUnit: randomQuestion.unit,
  });
}
