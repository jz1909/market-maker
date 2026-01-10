"use client";

import { useEffect, useState } from "react";
import { GameOver } from "./GameOver";
import { Scoreboard } from "./Scoreboard";
import { QuestionDisplay } from "./QuestionDisplay";
import { RoundResult } from "./RoundResult";
import { MakerPanel } from "./MakerPanel";
import { TakerPanel } from "./TakerPanel";
import { TradeHistory } from "./TradeRecord";
import { useGameChannel } from "@/lib/supabase_realtime/useGameChannel";
import { Navbar } from "../Navbar";

interface GameControllerProps {
  joinCode: string;
  game: {
    id: string;
    status: "LOBBY" | "ACTIVE" | "FINISHED";
    makerUserId: string;
    takerUserId: string | null;
    makerName: string;
    takerName: string | null;
    winnerId: string | null;
  };
  currentUserId: string;
  initialRound: {
    id: string;
    roundIndex: number;
    currentTurnIndex: number;
    status: "PENDING" | "LIVE" | "ENDED" | "SETTLED";
    questionPrompt: string;
    questionUnit: string | null;
    questionAnswer: number;
  } | null;

  initialQuote: { bid: number; ask: number } | null;
  initialTrades: Array<{
    turnIndex: number;
    bid: number;
    ask: number;
    side: "BUY" | "SELL" | null;
  }>;
}

export function GameController({
  joinCode,
  game,
  currentUserId,
  initialRound,
  initialQuote,
  initialTrades,
}: GameControllerProps) {
  const isMaker = game.makerUserId === currentUserId;
  const currentRole = isMaker ? "MAKER" : "TAKER";

  const [gameStatus, setGameStatus] = useState(game.status);
  const [winnerId, setWinnerId] = useState(game.winnerId);
  const [makerWins, setMakerWins] = useState(0);
  const [takerWins, setTakerWins] = useState(0);

  const [currentRound, setCurrentRound] = useState(initialRound);
  const [currentQuote, setCurrentQuote] = useState(initialQuote);
  const [trades, setTrades] = useState(initialTrades);
  const [roundResult, setRoundResult] = useState<{
    correctAnswer: number;
    makerPnL: number;
    takerPnL: number;
  } | null>(null);
  const [roundEnded, setRoundEnded] = useState(false);

  const [waitingForTaker, setWaitingForTaker] = useState(!!initialQuote);
  const isMyTurn = isMaker ? !waitingForTaker : waitingForTaker;

  const channelRole = isMaker ? "maker" : "taker";
  const displayName = isMaker ? game.makerName : (game.takerName ?? "Unknown");
  const { isConnected, lastEvent, presentUsers, broadcast } = useGameChannel(
    joinCode,
    currentUserId,
    channelRole,
    displayName,
  );

  const opponentId = isMaker ? game.takerUserId : game.makerUserId;
  const isOpponentOnline = opponentId
    ? presentUsers.includes(opponentId)
    : false;

  useEffect(() => {
    if (!lastEvent) return;

    switch (lastEvent.type) {
      case "game-started": {
        const data = lastEvent.data as { roundId: string; roundIndex: number };
        setGameStatus("ACTIVE");
        break;
      }

      case "round-started": {
        const data = lastEvent.data as {
          roundId: string;
          roundIndex: number;
          questionPrompt: string;
          questionUnit: string | null;
        };
        setCurrentRound({
          id: data.roundId,
          roundIndex: data.roundIndex,
          currentTurnIndex: 0,
          status: "LIVE",
          questionPrompt: data.questionPrompt,
          questionUnit: data.questionUnit,
          questionAnswer: 0,
        });
        setCurrentQuote(null);
        setTrades([]);
        setRoundResult(null);
        setWaitingForTaker(false);
        break;
      }

      case "quote-submitted": {
        const data = lastEvent.data as {
          bid: number;
          ask: number;
          turnIndex: number;
        };
        setCurrentQuote({ bid: data.bid, ask: data.ask });
        setWaitingForTaker(true);
        break;
      }

      case "trade-executed": {
        const data = lastEvent.data as {
          side: "BUY" | "SELL" | null;
          price: number;
          turnIndex: number;
        };
        setTrades((prev) => [
          ...prev,
          {
            turnIndex: data.turnIndex,
            bid: currentQuote?.bid ?? 0,
            ask: currentQuote?.ask ?? 0,
            side: data.side,
          },
        ]);
        setCurrentQuote(null);

        if (currentRound && currentRound.currentTurnIndex < 2) {
          setWaitingForTaker(false);
          setCurrentRound({
            ...currentRound,
            currentTurnIndex: currentRound.currentTurnIndex + 1,
          });
        }
        break;
      }
      case "round-ended": {
        setRoundEnded(true);
        break;
      }

      case "round-settled": {
        const data = lastEvent.data as {
          correctAnswer: number;
          makerPnL: number;
          takerPnL: number;
        };
        setRoundResult({
          correctAnswer: data.correctAnswer,
          makerPnL: data.makerPnL,
          takerPnL: data.takerPnL,
        });
        setRoundEnded(false);

        if (data.makerPnL > data.takerPnL) {
          setMakerWins((prev) => prev + 1);
        } else if (data.takerPnL > data.makerPnL) {
          setTakerWins((prev) => prev + 1);
        }
        break;
      }
      case "game-ended": {
        const data = lastEvent.data as {
          winnerId: string | null;
          makerW: number;
          takerW: number;
        };
        setGameStatus("FINISHED");
        setWinnerId(data.winnerId);
        setMakerWins(data.makerW);
        setTakerWins(data.takerW);
        break;
      }

      case "player-rejoined": {
        const data = lastEvent.data as { userId: string };
        break;
      }
    }
  }, [lastEvent]);

  const handleQuoteSubmitted = async (bid: number, ask: number) => {
    // locally update the ui and then broadcast
    setCurrentQuote({ bid, ask });
    setWaitingForTaker(true);

    await broadcast("quote-submitted", {
      bid,
      ask,
      turnIndex: currentRound?.currentTurnIndex ?? 0,
    });
  };

  const handleTradeExecuted = async (
    side: "BUY" | "SELL" | null,
    roundEnded: boolean,
  ) => {
    if (currentQuote && currentRound) {
      setTrades((prev) => [
        ...prev,
        {
          turnIndex: currentRound.currentTurnIndex,
          bid: currentQuote.bid,
          ask: currentQuote.ask,
          side,
        },
      ]);
      setCurrentQuote(null);

      await broadcast("trade-executed", {
        side,
        turnIndex: currentRound.currentTurnIndex,
      });

      if (!roundEnded && currentRound.currentTurnIndex < 2) {
        setWaitingForTaker(false);
        setCurrentRound({
          ...currentRound,
          currentTurnIndex: currentRound.currentTurnIndex + 1,
        });
      }

      if (roundEnded) {
        const res = await fetch(
          `/api/games/${joinCode}/rounds/${currentRound.id}/settlement`,
        );
        if (res.ok) {
          const data = await res.json();
          await broadcast("round-settled", {
            roundIndex: currentRound.roundIndex,
            correctAnswer: data.correctAnswer,
            makerPnL: data.makerPnL,
            takerPnL: data.takerPnL,
          });
          setRoundResult({
            correctAnswer: data.correctAnswer,
            makerPnL: data.makerPnL,
            takerPnL: data.takerPnL,
          });
          if (data.makerPnL > data.takerPnL) {
            setMakerWins((prev) => prev + 1);
          } else if (data.takerPnL > data.makerPnL) {
            setTakerWins((prev) => prev + 1);
          }
        }
      }
    }
  };

  const handleSettle = async () => {
    if (!currentRound) return;
    const res = await fetch(
      `/api/games/${joinCode}/rounds/${currentRound.id}/settle`,
      {
        method: "POST",
      },
    );

    if (!res.ok) {
      console.error("Failed to settle round");
    }
  };

  const handleContinue = async () => {
    if (!currentRound) return;
    const res = await fetch(
      `/api/games/${joinCode}/rounds/${currentRound.id}/advance`,
      {
        method: "POST",
      },
    );

    if (!res.ok) {
      console.error("Failed to continue game");
      return;
    }

    const data = await res.json();

    if (data.gameEnded) {
      setGameStatus("FINISHED");
      setWinnerId(data.winnerId);
      setMakerWins(data.makerW);
      setTakerWins(data.takerW);

      await broadcast("game-ended", {
        winnerId: data.winnerId,
        makerW: data.makerW,
        takerW: data.takerW,
      });
    } else if (data.nextRound) {
      setCurrentRound({
        id: data.nextRound.id,
        roundIndex: data.nextRound.roundIndex,
        currentTurnIndex: 0,
        status: "LIVE",
        questionPrompt: data.nextRound.questionPrompt,
        questionUnit: data.nextRound.questionUnit,
        questionAnswer: 0,
      });
      setCurrentQuote(null);
      setTrades([]);
      setRoundResult(null);
      setWaitingForTaker(false);

      await broadcast("round-started", {
        roundId: data.nextRound.id,
        roundIndex: data.nextRound.roundIndex,
        questionPrompt: data.nextRound.questionPrompt,
        questionUnit: data.nextRound.questionUnit,
      });
    }
  };

  if (gameStatus === "FINISHED") {
    return (
      <GameOver
        makerName={game.makerName}
        takerName={game.takerName ?? "Unknown"}
        makerWins={makerWins}
        takerWins={takerWins}
        currentRoles={currentRole}
        winnerId={winnerId}
        currentUserId={currentUserId}
      />
    );
  }

  if (roundResult && currentRound) {
    return (
      <div>
        <Scoreboard
          makerName={game.makerName}
          takerName={game.takerName ?? "Unknown"}
          makerWins={makerWins}
          takerWins={takerWins}
          currentRole={currentRole}
        />

        <RoundResult
          roundIndex={currentRound.roundIndex}
          correctAnswer={roundResult.correctAnswer}
          makerPnL={roundResult.makerPnL}
          takerPnL={roundResult.takerPnL}
          currentRole={currentRole}
          onContinue={handleContinue}
          isMaker={isMaker}
        />
      </div>
    );
  }

  if (gameStatus === "ACTIVE" && currentRound) {
    return (
      <div>
        <Navbar />

        <Scoreboard
          makerName={game.makerName}
          takerName={game.takerName ?? "Unknown"}
          makerWins={makerWins}
          takerWins={takerWins}
          currentRole={currentRole}
        />

        <QuestionDisplay
          prompt={currentRound.questionPrompt}
          unit={currentRound.questionUnit}
          roundIndex={currentRound.roundIndex}
        />

        {isMaker ? (
          <MakerPanel
            joinCode={joinCode}
            roundId={currentRound.id}
            currentTurn={currentRound.currentTurnIndex}
            isMyTurn={isMyTurn}
            onQuoteSubmitted={handleQuoteSubmitted}
          />
        ) : (
          <TakerPanel
            joinCode={joinCode}
            roundId={currentRound.id}
            currentTurn={currentRound.currentTurnIndex}
            currentQuote={currentQuote}
            isMyTurn={isMyTurn}
            onTradeExecuted={handleTradeExecuted}
          />
        )}

        {!isOpponentOnline && (
          <div className="flex flex-col items-center">
            <div className="text-red-500 text-sm">
              Opponent has left the game... Waiting for opponent to reconnect
            </div>
          </div>
        )}

        <TradeHistory trades={trades} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Game Lobby</h1>
        <p className="text-gray-600 mb-2">
          Join Code: <span className="font-mono font-bold">{joinCode}</span>
        </p>
        <p className="text-gray-600 mb-4">
          {game.takerUserId
            ? `${game.takerName} has joined!`
            : "Waiting for opponent to join..."}
        </p>
        <p className="text-sm text-gray-500">
          You are the <span className="font-bold">{currentRole}</span>
        </p>
        {!isConnected && (
          <p className="text-yellow-600 text-sm mt-4">
            Connecting to server...
          </p>
        )}
      </div>
    </div>
  );
}
