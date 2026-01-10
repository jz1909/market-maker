import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, games, rounds } from "@/lib/schema/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { settleRound } from "@/lib/engine/game";
import {
  createGameEvent,
  RoundSettledData,
} from "@/lib/supabase_realtime/events";
import { broadcastToGame } from "@/lib/supabase_realtime/broadcast";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ joinCode: string; roundId: string }> },
) {
  const { joinCode, roundId } = await params;

  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const game = await db.query.games.findFirst({
    where: eq(games.joinCode, joinCode),
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  if (game.takerUserId !== dbUser.id && game.makerUserId !== dbUser.id) {
    return NextResponse.json({ error: "Not a participant" }, { status: 403 });
  }

  const round = await db.query.rounds.findFirst({
    where: eq(rounds.id, roundId),
  });

  if (!round) {
    return NextResponse.json({ error: "Round not found" }, { status: 404 });
  }

  if (round.roundStatus !== "ENDED") {
    return NextResponse.json(
      { error: "Round is not finished" },
      { status: 400 },
    );
  }

  const result = await settleRound(roundId);

  if (!result) {
    return NextResponse.json(
      { error: "Failed to settle round" },
      { status: 500 },
    );
  }

  const settleEventData: RoundSettledData = {
    roundIndex: round.roundIndex,
    correctAnswer: result.correctAnswer,
    makerPnL: result.makerPnL,
    takerPnL: result.takerPnL,
  };

  await broadcastToGame(joinCode, createGameEvent("round-settled", settleEventData));

  return NextResponse.json({
    success: true,
    correctAnswer: result.correctAnswer,
    makerPnL: result.makerPnL,
    takerPnL: result.takerPnL,
  });
}
