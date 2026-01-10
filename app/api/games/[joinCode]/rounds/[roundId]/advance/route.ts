import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, games, rounds } from "@/lib/schema/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { advanceGame, startRound } from "@/lib/engine/game";
import {
  createGameEvent,
  GameEndedData,
  RoundStartedData,
} from "@/lib/supabase_realtime/events";
import { calculateGameWin, calculateRoundPnL } from "@/lib/engine/scoring";
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

    await broadcastToGame(joinCode, createGameEvent("game-ended", winEventData));

    return NextResponse.json({
      success: true,
      gameEnded: true,
      winnerId,
      makerW,
      takerW,
    });
  }

  // Set new round to LIVE and fetch question data
  if (result.nextRoundId) {
    await startRound(result.nextRoundId);

    // Fetch the new round with question data for broadcast
    const newRound = await db.query.rounds.findFirst({
      where: eq(rounds.id, result.nextRoundId),
      with: { question: true },
    });

    if (newRound) {
      // Only broadcast round-started - it contains all needed data
      const roundStartedData: RoundStartedData = {
        roundId: result.nextRoundId,
        roundIndex: newRound.roundIndex,
        questionPrompt: newRound.question.prompt,
        questionUnit: newRound.question.unit,
      };
      await broadcastToGame(
        joinCode,
        createGameEvent("round-started", roundStartedData),
      );
    }
  }

  // Fetch the new round data for the response
  const newRoundData = result.nextRoundId
    ? await db.query.rounds.findFirst({
        where: eq(rounds.id, result.nextRoundId),
        with: { question: true },
      })
    : null;

  return NextResponse.json({
    success: true,
    gameEnded: false,
    nextRoundId: result.nextRoundId,
    nextRound: newRoundData
      ? {
          id: newRoundData.id,
          roundIndex: newRoundData.roundIndex,
          questionPrompt: newRoundData.question.prompt,
          questionUnit: newRoundData.question.unit,
        }
      : null,
  });
}
