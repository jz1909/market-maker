"use client";

interface TradeRecord {
  turnIndex: number;
  bid: number;
  ask: number;
  side: "BUY" | "SELL" | null;
}

interface TradeHistoryProps {
  trades: TradeRecord[];
}

export function TradeHistory({ trades }: TradeHistoryProps) {
  if (trades.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-50 border-2 border-gray-400 rounded-lg p-4 m-10">
      <h3 className="font-semibold text-gray-700 mb-2">
        <div className="space-y-2">
          {trades.map((trade) => (
            <div
              key={trade.turnIndex}
              className="flex justify-center items-center text-lg"
            >
              <span className="text-gray-600">
                Turn {trade.turnIndex + 1} - &nbsp;
              </span>
              <span className="font-mono">
                {" "}
                {trade.bid} @ {trade.ask} &nbsp;
              </span>
              <span
                className={`font-semibold
                                 ${trade.side === "BUY" ? "text-green-600" : trade.side === "SELL" ? "text-red-600" : "text-gray-400"}`}
              >
                | Taker {trade.side ?? "PASS"}
              </span>
            </div>
          ))}
        </div>
      </h3>
    </div>
  );
}
