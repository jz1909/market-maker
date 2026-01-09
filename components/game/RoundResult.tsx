"use client";

import { useState } from "react";
import { Button } from "../ui/button";

interface RoundResultProps {
  roundIndex: number;
  correctAnswer: number;
  makerPnL: number;
  takerPnL: number;
  currentRole: "MAKER" | "TAKER";
  onContinue: () => void | Promise<void>;
  isMaker: boolean;
}

export function RoundResult({
  roundIndex,
  correctAnswer,
  makerPnL,
  takerPnL,
  currentRole,
  onContinue,
  isMaker,
}: RoundResultProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    setIsLoading(true);
    try {
      await onContinue();
    } finally {
      setIsLoading(false);
    }
  };

  const makerWon = makerPnL > takerPnL;
  const takerWon = takerPnL > makerPnL;

  const tie = makerPnL === takerPnL;

  const myPnL = currentRole === "MAKER" ? makerPnL : takerPnL;
  const iWon =
    (currentRole === "MAKER" && makerWon) ||
    (currentRole === "TAKER" && takerWon);

  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg p-6 text-center">
      <h2 className="text-2xl font-bold mb-4">
        Round {roundIndex + 1} Complete!
      </h2>
      <div className="mb-4">
        <span className="text-gray-600 mb-1 text-2xl">
          The correct answer was:{" "}
        </span>
        <span className="text-2xl font-bold text-blue-600">
          {correctAnswer}
        </span>
      </div>

      <div className="m-10 mt-15 grid grid-cols-2 gap-4 mb-15">
        <div
          className={`p-4 rounded-lg ${makerWon ? "bg-green-100 border-2 border-green-500" : !tie ? "bg-red-100 border-2 border-red-500" : "bg-gray-100"}`}
        >
          <p>Maker P&L</p>
          <p
            className={`text-2xl font-bold ${makerPnL >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {makerPnL >= 0
              ? "+" + makerPnL.toFixed(2)
              : "-$" + Math.abs(makerPnL)}
          </p>
          {makerWon && <span>Winner!</span>}
        </div>

        <div
          className={`p-4 rounded-lg ${takerWon ? "bg-green-100 border-2 border-green-500" : !tie ? "bg-red-100 border-2 border-red-500" : "bg-gray-100"}`}
        >
          <p>Taker P&L</p>
          <p
            className={`text-2xl font-bold ${takerPnL >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {takerPnL >= 0
              ? "+" + takerPnL.toFixed(2)
              : "-$" + Math.abs(takerPnL)}
          </p>
          {takerWon && <span>Winner!</span>}
        </div>
      </div>

      {tie && (
        <p className="text-gray-600 mb-4 text-2xl font-bold">It's a tie!</p>
      )}

      <p className="text-lg mb-4">
        You {iWon ? "won" : tie ? "tied" : "lost"} this round!{" "}
        <span
          className={`font-bold ${myPnL > 0 ? "text-green-600" : myPnL === 0 ? "text-gray-600" : "text-red-600"}`}
        >
          ({myPnL > 0 ? "+" : ""}
          {myPnL.toFixed(2)})
        </span>
      </p>

      {isMaker ? (
        <Button
          className={`p-5 font-bold m-5 ${isLoading ? "cursor-wait" : ""}`}
          onClick={handleContinue}
          disabled={isLoading}
        >
          {roundIndex < 2 ? "Next Round" : "See final results"}
        </Button>
      ) : (
        <p>Waiting for host to continue...</p>
      )}
    </div>
  );
}
