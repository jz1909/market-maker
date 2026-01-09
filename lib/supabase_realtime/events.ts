export type GameEventType =
  | "player-joined"
  | "player-left"
  | "player-rejoined"
  | "game-started"
  | "round-started"
  | "quote-submitted"
  | "trade-executed"
  | "round-ended"
  | "round-settled"
  | "game-ended";

export interface GameEvent {
  type: GameEventType;
  timestamp: number;
  data: unknown;
}

export interface PlayerJoinedData {
  takerName: string;
  takerId: string;
}

export interface GameStartedData {
  roundId: string;
  roundIndex: number;
}

export interface RoundStartedData {
  roundId: string;
  roundIndex: number;
  questionPrompt: string;
  questionUnit: string | null;
}

export interface RoundEndedData {
  roundIndex: number;
}

export interface QuoteSubmittedData {
  turnIndex: number;
  bid: number;
  ask: number;
}

export interface TradeExecutedData {
  turnIndex: number;
  side: "BUY" | "SELL" | null;
}

export interface RoundSettledData {
  roundIndex: number;
  correctAnswer: number;
  makerPnL: number;
  takerPnL: number;
}

export interface GameEndedData {
  winnerId: string | null;
  makerW: number;
  takerW: number;
}

// GameEvent defines the overall event and type, and the rest are data that fits in to the GameEvent
export function createGameEvent<T>(type: GameEventType, data: T): GameEvent {
  return { type, timestamp: Date.now(), data };
}
