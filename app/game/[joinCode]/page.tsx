import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, games, rounds, quotes, trades } from "@/lib/schema/schema";
import { and, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StartGameButton } from "@/components/StartGameButton";
import { QuestionDisplay } from "@/components/game/QuestionDisplay";
import { Timer } from "@/components/game/Timer";
import { Scoreboard } from "@/components/game/Scoreboard";
import { MakerPanel } from "@/components/game/MakerPanel";
import { TakerPanel } from "@/components/game/TakerPanel";
import { TradeHistory } from "@/components/game/TradeRecord";
import { RoundResult } from "@/components/game/RoundResult";
import { GameOver } from "@/components/game/GameOver";
import { GameController } from "@/components/game/GameController";
import { LobbyController } from "@/components/game/LobbyController";

// Force dynamic rendering - game state changes frequently
export const dynamic = "force-dynamic";

export default async function GamePage({
  params,
}: {
  params: Promise<{ joinCode: string }>;
}) {
  const { joinCode } = await params;

  // auth
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    redirect("/");
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
  });

  if (!dbUser) {
    redirect("/");
  }

  // Fetch game
  const game = await db.query.games.findFirst({
    where: eq(games.joinCode, joinCode),
    with: { maker: true, taker: true },
  });

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl">Game Not Found</h1>
      </div>
    );
  }

  // auth participants
  const isMaker = game.makerUserId === dbUser.id;
  const isTaker = game.takerUserId === dbUser.id;

  if (!isMaker && !isTaker) {
    redirect("/");
  }

  // derive page vars
  const bothPlayerPresent = game.makerUserId && game.takerUserId;

  // render game page based on status aswell

  if (game.gameStatus === "LOBBY") {
    return (
      <LobbyController
        joinCode={joinCode}
        game={{
          id: game.id,
          makerUserId: game.makerUserId!,
          takerUserId: game.takerUserId,
          makerName: game.maker?.displayName ?? "Unknown",
          takerName: game.taker?.displayName ?? null,
        }}
        currentUserId={dbUser.id}
      />
    );
  }

  // Active or finished

  const currentRound = await db.query.rounds.findFirst({
    where: and(
      eq(rounds.gameId, game.id),
      eq(rounds.roundIndex, game.currentRoundIndex),
    ),
    with: { question: true },
  });

  let initialQuote: { bid: number; ask: number } | null = null;
  if (currentRound) {
    const latestQuote = await db.query.quotes.findFirst({
      where: and(
        eq(quotes.roundId, currentRound.id),
        eq(quotes.turnIndex, currentRound.currentTurnIndex),
      ),
      orderBy: desc(quotes.createdAt),
    });

    if (latestQuote) {
      initialQuote = {
        bid: Number(latestQuote.bid),
        ask: Number(latestQuote.ask),
      };
    }
  }

  const initialTrades = currentRound
    ? (
        await db
          .select({
            turnIndex: trades.turnIndex,
            side: trades.side,
            bid: quotes.bid,
            ask: quotes.ask,
          })
          .from(trades)
          .leftJoin(
            quotes,
            and(
              eq(trades.roundId, quotes.roundId),
              eq(trades.turnIndex, quotes.turnIndex),
            ),
          )
          .where(eq(trades.roundId, currentRound.id))
      ).map((t) => ({
        turnIndex: t.turnIndex,
        side: t.side as "BUY" | "SELL" | null,
        bid: Number(t.bid ?? 0),
        ask: Number(t.ask ?? 0),
      }))
    : [];

  const initialRoundData = currentRound
    ? {
        id: currentRound.id,
        roundIndex: currentRound.roundIndex,
        currentTurnIndex: currentRound.currentTurnIndex,
        status: currentRound.roundStatus as
          | "PENDING"
          | "LIVE"
          | "ENDED"
          | "SETTLED",
        questionPrompt: currentRound.question.prompt,
        questionUnit: currentRound.question.unit,
        questionAnswer: Number(currentRound.question.answer),
      }
    : null;

  return (
    <GameController
      joinCode={joinCode}
      game={{
        id: game.id,
        status: game.gameStatus as "LOBBY" | "ACTIVE" | "FINISHED",
        makerUserId: game.makerUserId!,
        takerUserId: game.takerUserId,
        makerName: game.maker?.displayName ?? "Unknown",
        takerName: game.taker?.displayName ?? null,
        winnerId: game.winnerUserId,
      }}
      currentUserId={dbUser.id}
      initialRound={initialRoundData}
      initialQuote={initialQuote}
      initialTrades={initialTrades}
    />
  );
}
