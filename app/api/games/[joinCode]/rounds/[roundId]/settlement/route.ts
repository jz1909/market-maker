import { db } from "@/lib/db";
import { rounds } from "@/lib/schema/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { calculateRoundPnL } from "@/lib/engine/scoring";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ joinCode: string; roundId: string }> },
) {
  const { roundId } = await params;

  const round = await db.query.rounds.findFirst({
    where: eq(rounds.id, roundId),
    with: { question: true, trades: true },
  });

  if (!round) {
    return NextResponse.json({ error: "Round not found" }, { status: 404 });
  }

  if (round.roundStatus !== "SETTLED") {
    return NextResponse.json({ error: "Round not settled" }, { status: 400 });
  }

  const correctAnswer = Number(round.question.answer);
  const trades = round.trades.map((t) => ({
    side: t.side,
    price: Number(t.price),
    quantity: t.quantity,
  }));

  const { makerPnL, takerPnL } = calculateRoundPnL(trades, correctAnswer);

  return NextResponse.json({
    correctAnswer,
    makerPnL,
    takerPnL,
  });
}
