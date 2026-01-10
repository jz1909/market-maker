"use client";

interface ScoreboardProps {
  makerName: string;
  takerName: string;
  // Rounds won
  makerWins: number;
  takerWins: number;
  currentRole: "MAKER" | "TAKER";
}

export function Scoreboard({
  makerName,
  takerName,
  makerWins,
  takerWins,
  currentRole,
}: ScoreboardProps) {
  return (
    <div className="flex justify-around items-center bg-linear-to-r from-blue-400 to-green-500  p-4 mb-4">
      <div
        className="flex flex-col items-center p-3 rounded-lg bg-blue-100 border-2 border-blue-500"
      >
        <span className="text-sm text-gray-600">Maker</span>
        <span className="font-semibold">{makerName}</span>
        <span className="text-2xl font-bold text-blue-600">{makerWins}</span>
        <span className="text-xs text-gray-500">wins</span>
      </div>
      <div className="text-3xl font-bold text-white">vs</div>
      <div
        className="flex flex-col items-center p-3 rounded-lg bg-green-100 border-2 border-green-600"
      >
        <span className="text-sm text-gray-600">Taker</span>
        <span className="font-semibold">{takerName}</span>
        <span className="text-2xl font-bold text-green-600">{takerWins}</span>
        <span className="text-xs text-gray-500">wins</span>
      </div>
    </div>
  );
}
