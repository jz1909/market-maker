import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, games, rounds } from "@/lib/schema/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { advanceGame } from "@/lib/engine/game";
import { broadcastToGame } from "@/lib/realtime/eventEmitter";
import {
  createGameEvent,
  GameStartedData,
  GameEndedData,
} from "@/lib/realtime/events";
import { calculateGameWin, calculateRoundPnL } from "@/lib/engine/scoring";

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

  if (game.makerUserId !== dbUser.id) {
    return NextResponse.json(
      { error: "Only maker can advance the game" },
      { status: 403 },
    );
  }

  const result = await advanceGame(game.id);

  if (result.gameEnded) {
    const allRounds = await db.query.rounds.findMany({
      where: eq(rounds.gameId, game.id),
      with: { question: true, trades: true },
    });

    let makerTotalPnL = 0;
    let takerTotalPnL = 0;

    const roundResults = allRounds.map((round) => {
      const correctAnswer = Number(round.question.answer);
      const trades = round.trades.map((t) => ({
        side: t.side,
        price: Number(t.price),
        quantity: t.quantity,
      }));
      return calculateRoundPnL(trades, correctAnswer);
    });
    const { makerW, takerW } = calculateGameWin(roundResults);

    let winnerId: string | null = null;
    if (makerW > takerW) {
      winnerId = game.makerUserId;
    } else if (takerW > makerW) {
      winnerId = game.takerUserId;
    }

    if (winnerId) {
      await db
        .update(games)
        .set({ winnerUserId: winnerId })
        .where(eq(games.id, game.id));
    }

    const winEventData: GameEndedData = {
      winnerId,
      makerW,
      takerW,
    };

    broadcastToGame(joinCode, createGameEvent("game-ended", winEventData));

    return NextResponse.json({
      success: true,
      gameEnded: true,
      winnerId,
      makerW,
      takerW,
    });
  }

  const continueEventdata: GameStartedData = {
    roundId: result.nextRoundId!,
    roundIndex: game.currentRoundIndex + 1,
  };

  broadcastToGame(joinCode, createGameEvent("game-started", continueEventdata));

  return NextResponse.json({
    success: true,
    gameEnded: false,
    nextRoundId: result.nextRoundId,
  });
}
