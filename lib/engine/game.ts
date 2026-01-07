import { db } from "@/lib/db";
import { games, rounds, quotes, trades, questions } from "@/lib/schema/schema";
import { eq, sql } from "drizzle-orm";
import { calculateRoundPnL } from "./scoring";
import { DEFAULT_GAME_CONFIG, Trade } from "./types";

// start round
export async function startRound(roundId: string): Promise<void> {
  await db
    .update(rounds)
    .set({ roundStatus: "LIVE", startedAt: new Date() })
    .where(eq(rounds.id, roundId));
}

export async function submitQuote(
  roundId: string,
  turnIndex: number,
  makerUserId: string,
  bid: number,
  ask: number,
): Promise<void> {
  await db.insert(quotes).values({
    roundId: roundId,
    turnIndex: turnIndex,
    makerUserId: makerUserId,
    bid: bid.toString(),
    ask: ask.toString(),
  });
}

export async function executeTrade(
  roundId: string,
  turnIndex: number,
  gameId: string,
  takerUserId: string,
  side: "BUY" | "SELL" | null,
  price: number,
  quantity: number = DEFAULT_GAME_CONFIG.defaultQuantity,
): Promise<void> {
  if (side !== null) {
    await db.insert(trades).values({
      roundId: roundId,
      turnIndex: turnIndex,
      gameId: gameId,
      takerUserId: takerUserId,
      side: side,
      price: price.toString(),
      quantity: quantity,
    });
  }
  await advanceTurn(roundId);
}

export async function advanceTurn(
  roundId: string,
): Promise<{ nextTurnIndex: number | null; roundEnded: boolean }> {
  const round = await db.query.rounds.findFirst({
    where: eq(rounds.id, roundId),
  });

  if (!round) throw new Error("Round not found");

  const nextTurn = round.currentTurnIndex + 1;

  if (nextTurn >= DEFAULT_GAME_CONFIG.turnsPerRound) {
    await db
      .update(rounds)
      .set({ roundStatus: "ENDED", endedAt: new Date() })
      .where(eq(rounds.id, roundId));

    return { nextTurnIndex: null, roundEnded: true };
  }

  await db
    .update(rounds)
    .set({ currentTurnIndex: nextTurn })
    .where(eq(rounds.id, roundId));
  return { nextTurnIndex: nextTurn, roundEnded: false };
}

export async function settleRound(roundId: string): Promise<{
  makerPnL: number;
  takerPnL: number;
  correctAnswer: number;
} | null> {
  const round = await db.query.rounds.findFirst({
    where: eq(rounds.id, roundId),
    with: { question: true },
  });

  if (!round || !round.question) return null;

  const roundTrades = await db.query.trades.findMany({
    where: eq(trades.roundId, roundId),
  });

  const TradeList: Trade[] = roundTrades.map((t) => ({
    side: t.side,
    price: Number(t.price),
    quantity: t.quantity,
  }));

  const correctAnswer = Number(round.question.answer);
  const { makerPnL, takerPnL } = calculateRoundPnL(TradeList, correctAnswer);

  await db
    .update(rounds)
    .set({ roundStatus: "SETTLED" })
    .where(eq(rounds.id, roundId));

  return { makerPnL, takerPnL, correctAnswer };
}

export async function advanceGame(
  gameId: string,
): Promise<{ nextRoundId: string | null; gameEnded: boolean }> {
  const game = await db.query.games.findFirst({
    where: eq(games.id, gameId),
    with: { rounds: true },
  });

  if (!game) {
    throw new Error("Game not found");
  }

  // use length to represent new last item in array
  const currentRoundIndex = game.rounds.length;

  if (currentRoundIndex >= DEFAULT_GAME_CONFIG.totalRounds) {
    await db
      .update(games)
      .set({ gameStatus: "FINISHED", finishedAt: new Date() })
      .where(eq(games.id, gameId));
    return { nextRoundId: null, gameEnded: true };
  }

  const [randomQuestion] = await db
    .select()
    .from(questions)
    .orderBy(sql`RANDOM()`)
    .limit(1);

  if (!randomQuestion) throw new Error("No questions available");

  const [newRound] = await db
    .insert(rounds)
    .values({
      gameId,
      roundIndex: currentRoundIndex,
      questionId: randomQuestion.id,
      roundStatus: "PENDING",
    })
    .returning();

  if (!newRound) throw new Error("Round not found");

  await db.update(games).set({ currentRoundIndex }).where(eq(games.id, gameId));

  return { nextRoundId: newRound.id, gameEnded: false };
}
