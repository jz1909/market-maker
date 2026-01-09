import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, games, rounds } from "@/lib/schema/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { startRound } from "@/lib/engine/game";
import { broadcastToGame } from "@/lib/supabase_realtime/broadcast";
import {
  createGameEvent,
  RoundStartedData,
} from "@/lib/supabase_realtime/events";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ joinCode: string; roundId: string }> },
) {
  const { joinCode, roundId } = await params;

  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
  });

  if (!dbUser) {
    return NextResponse.json(
      { error: "User not found in database" },
      { status: 404 },
    );
  }

  const game = await db.query.games.findFirst({
    where: eq(games.joinCode, joinCode),
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  if (game.makerUserId !== dbUser.id) {
    return NextResponse.json(
      { error: "Only maker can start round" },
      { status: 403 },
    );
  }

  const round = await db.query.rounds.findFirst({
    where: eq(rounds.id, roundId),
    with: { question: true },
  });

  if (!round) {
    return NextResponse.json({ error: "Round not found" }, { status: 404 });
  }

  if (round.roundStatus !== "PENDING") {
    return NextResponse.json(
      { error: "Round already started" },
      { status: 400 },
    );
  }

  await startRound(roundId);

  const eventData: RoundStartedData = {
    roundId,
    roundIndex: round.roundIndex,
    questionPrompt: round.question.prompt,
    questionUnit: round.question.unit,
  };

  broadcastToGame(joinCode, createGameEvent("round-started", eventData));

  return NextResponse.json({ success: true });
}
