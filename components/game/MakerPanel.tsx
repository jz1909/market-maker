"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface MakerPanelProps {
  joinCode: string;
  roundId: string;
  currentTurn: number;
  isMyTurn: boolean;
  onQuoteSubmitted: () => void;
}

export function MakerPanel({
  joinCode,
  roundId,
  currentTurn,
  isMyTurn,
  onQuoteSubmitted,
}: MakerPanelProps) {
  const [bid, setBid] = useState<string>("");
  const [ask, setAsk] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    const bidNum = parseFloat(bid);
    const askNum = parseFloat(ask);

    if (isNaN(bidNum) || isNaN(askNum)) {
      setError("Please enter valid numbers");
      return;
    }

    if (bidNum >= askNum) {
      setError("Bid must be less than ask");
      return;
    }

    if (bidNum < 0 || askNum < 0) {
      setError("Values must be non negative");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `/api/games/${joinCode}/rounds/${roundId}/quote`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bid: bidNum, ask: askNum }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit quote");
        return;
      }

      setBid("");
      setAsk("");
      onQuoteSubmitted?.();
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-blue-50 border-2 border-blue-200 rounded-lg p-4 m-10 items-center">
      <h3 className="font-semibold text-2xl text-blue-800 mb-3">
        Your Quote (Turn {currentTurn + 1} of 3)
      </h3>

      <div className="w-full flex items-center justify-around gap-4 mb-4 mt-10">
        <div className="">
          <label className="text-xl font-bold">Bid (Buy at)</label>
          <input
            type="number"
            value={bid}
            onChange={(e) => setBid(e.target.value)}
            placeholder="0"
            className=" px-3 ml-3 py-2 border rounded-lg"
            disabled={!isMyTurn || loading}
          />
        </div>
        <div className="">
          <label className="text-xl font-bold">Ask (Sell at)</label>
          <input
            type="number"
            value={ask}
            onChange={(e) => setAsk(e.target.value)}
            placeholder="0"
            className=" px-3 ml-3 py-2 border rounded-lg"
            disabled={!isMyTurn || loading}
          />
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

      <Button
        onClick={handleSubmit}
        disabled={!isMyTurn || loading}
        className="font-bold text-xl bg-none bg-blue-600 hover:bg-blue-500 mt-10 w-[15vw]"
      >
        {loading
          ? "Submitting"
          : isMyTurn
            ? "Submit Quote"
            : "Waiting for taker..."}
      </Button>
    </div>
  );
}
