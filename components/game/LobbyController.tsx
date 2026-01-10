"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StartGameButton } from "@/components/StartGameButton";
import Link from "next/link";
import { useGameChannel } from "@/lib/supabase_realtime/useGameChannel";
import { currentUser } from "@clerk/nextjs/server";
import { ReturnHomeButton } from "../ReturnHomeButton";

interface LobbyControllerProps {
  joinCode: string;
  game: {
    id: string;
    makerUserId: string | null;
    takerUserId: string | null;
    makerName: string | null;
    takerName: string | null;
  };
  currentUserId: string;
}

export function LobbyController({
  joinCode,
  game,
  currentUserId,
}: LobbyControllerProps) {
  const router = useRouter();

  const isMaker = game.makerUserId === currentUserId;
  const isTaker = game.takerUserId === currentUserId;

  const [takerName, setTakerName] = useState(game.takerName);
  const [takerId, setTakerId] = useState(game.takerUserId);
  const [makerName, setMakerName] = useState(game.makerName);
  const [makerId, setMakerId] = useState(game.makerUserId);
  const [makerLeft, setMakerLeft] = useState(false);

  const bothPlayersPresent = game.makerUserId && takerId;

  const currentRole = isMaker ? "maker" : "taker";
  const currentDisplayName = isMaker
    ? game.makerName
    : (game.takerName ?? "Unknown");
  const { isConnected, lastEvent, broadcast } = useGameChannel(
    joinCode,
    currentUserId,
    currentRole,
    currentDisplayName,
  );

  useEffect(() => {
    if (!lastEvent) return;

    switch (lastEvent.type) {
      case "player-joined": {
        const data = lastEvent.data as { takerName: string; takerId: string };
        setTakerName(data.takerName);
        setTakerId(data.takerId);
        break;
      }

      case "player-left": {
        const data = lastEvent.data as { userId: string };
        if (data.userId === takerId) {
          setTakerName(null);
          setTakerId(null);
        } else if (data.userId === makerId) {
          setMakerName(null);
          setMakerId(null);
          setMakerLeft(true);
        }
        break;
      }

      case "player-rejoined": {
        const data = lastEvent.data as {
          userId: string;
          role: string;
          displayName: string;
        };
        if (data.role === "taker" && data.userId !== currentUserId) {
          setTakerId(data.userId);
          setTakerName(data.displayName);
        } else if (data.role === "maker" && data.userId !== currentUserId) {
          setMakerId(data.userId);
          setMakerName(data.displayName);
          setMakerLeft(false);
        }
        break;
      }

      case "game-started": {
        // Force a full page reload to get fresh server data
        window.location.reload();
        break;
      }
    }
  }, [lastEvent, router, takerId]);

  return (
    <div className="min-h-screen p-8">
      <ReturnHomeButton />
      <main className="w-fill flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-8">Game Lobby</h1>

        <div
          className="flex flex-col justify-center items-center
  bg-gray-100 rounded-2xl p-5"
        >
          <p className="text-xl">Share this code with your opponent:</p>
          <p
            className="text-4xl font-mono tracking-widest
  mt-3"
          >
            {joinCode}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-10 mb-8 mt-10">
          <div
            className={`p-4 rounded-lg border-2 ${
              isMaker ? "border-blue-500 bg-blue-50" : "border-gray-300"
            }`}
          >
            <p className="text-lg font-bold">Market Maker</p>
            <p className="text-center">{makerName ?? "Waiting..."}</p>
            {isMaker && <div className="text-xs text-center">(You)</div>}
          </div>

          <div
            className={`p-4 rounded-lg border-2 ${
              isTaker ? "border-blue-500 bg-blue-50" : "border-gray-300"
            }`}
          >
            <p className="text-lg font-bold">Market Taker</p>
            <p className="text-center">{takerName ?? "Waiting..."}</p>
            {isTaker && <div className="text-xs text-center">(You)</div>}
          </div>
        </div>

        <div>
          <StartGameButton
            disabled={!bothPlayersPresent || isTaker}
            className={`!text-white hover:bg-gray-800 p-7 text-white ${bothPlayersPresent ? "" : "bg-none bg-gray-100 border-gray text-gray-400 hover:bg-gray-100"}`}
            joinCode={joinCode}
            onGameStarted={async (roundId, questionPrompt, questionUnit) => {
              await broadcast("game-started", { roundId, roundIndex: 0 });
              await broadcast("round-started", {
                roundId,
                roundIndex: 0,
                questionPrompt,
                questionUnit,
              });
            }}
          />
        </div>

        {isTaker && (
          <div className="text-center text-gray-600 mt-12 text-lg">
            Waiting for host to start the game...
          </div>
        )}

        {isMaker && !bothPlayersPresent && (
          <div className="text-center text-gray-600 mt-12 text-lg">
            Waiting for an opponent to join...
          </div>
        )}

        {isTaker && makerLeft && (
          <div className="text-sm text-red-500">Maker has left the game...</div>
        )}

        {!isConnected && (
          <p className="text-yellow-600 text-sm mt-4">
            Connecting to server...
          </p>
        )}
      </main>
    </div>
  );
}
