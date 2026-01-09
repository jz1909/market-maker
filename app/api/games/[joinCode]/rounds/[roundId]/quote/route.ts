import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, games, rounds } from "@/lib/schema/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { submitQuote } from "@/lib/engine/game";
import { isValidQuote } from "@/lib/engine/scoring";
import { createGameEvent, QuoteSubmittedData } from "@/lib/supabase_realtime/events";
import { broadcastToGame } from "@/lib/supabase_realtime/broadcast";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ joinCode: string; roundId: string }> },
) {
  const { joinCode, roundId } = await params;
  const body = await req.json();
  const { bid, ask } = body;
  if (typeof bid !== "number" || typeof ask !== "number") {
    return NextResponse.json(
      { error: "Invalid bid ask values" },
      { status: 400 },
    );
  }

  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
  });

  if (!dbUser) {
    return NextResponse.json(
      { error: "User not in database" },
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
      { error: "Only maker can submit a quote" },
      { status: 403 },
    );
  }

  const round = await db.query.rounds.findFirst({
    where: eq(rounds.id, roundId),
  });

  if (!round) {
    return NextResponse.json({ error: "Round not found" }, { status: 404 });
  }

  if (round.roundStatus !== "LIVE") {
    return NextResponse.json({ error: "Round is not live" }, { status: 400 });
  }

  if (!isValidQuote(bid, ask)) {
    return NextResponse.json(
      { error: "Invalid quote, bid must be less than ask" },
      { status: 400 },
    );
  }

  await submitQuote(roundId, round.currentTurnIndex, dbUser.id, bid, ask);

  const eventData: QuoteSubmittedData = {
    turnIndex: round.currentTurnIndex,
    bid,
    ask,
  };

  broadcastToGame(joinCode, createGameEvent("quote-submitted", eventData));

  return NextResponse.json({
    success: true,
    turnIndex: round.currentTurnIndex,
  });
}
