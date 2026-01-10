import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, games, rounds, quotes } from "@/lib/schema/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { executeTrade, settleRound } from "@/lib/engine/game";
import { getTradePrice } from "@/lib/engine/scoring";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ joinCode: string; roundId: string }> },
) {
  const { joinCode, roundId } = await params;
  const body = await req.json();
  const { side } = body;

  if (side !== "BUY" && side !== "SELL" && side !== null) {
    return NextResponse.json({ error: "Invalid side value" }, { status: 400 });
  }

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

  if (game.takerUserId !== dbUser.id) {
    return NextResponse.json(
      { error: "Only taker can make a trade" },
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

  const currentQuote = await db.query.quotes.findFirst({
    where: and(
      eq(quotes.roundId, roundId),
      eq(quotes.turnIndex, round.currentTurnIndex),
    ),
  });

  if (!currentQuote) {
    return NextResponse.json(
      { error: "No quote for current turn" },
      { status: 400 },
    );
  }

  let price = 0;
  if (side !== null) {
    price = getTradePrice(
      Number(currentQuote.bid),
      Number(currentQuote.ask),
      side,
    );
  }

  const turnIndexBeforeTrade = round.currentTurnIndex;

  await executeTrade(
    roundId,
    turnIndexBeforeTrade,
    game.id,
    dbUser.id,
    side,
    price,
  );

  // check if round ended, auto-settle if so
  const updatedRound = await db.query.rounds.findFirst({
    where: eq(rounds.id, roundId),
  });

  if (updatedRound?.roundStatus === "ENDED") {
    // Auto-settle the round
    await settleRound(roundId);
  }

  // Client-side broadcasting handles notifying the maker

  return NextResponse.json({
    success: true,
    turnIndex: turnIndexBeforeTrade,
    roundEnded: updatedRound?.roundStatus === "ENDED",
  });
}
