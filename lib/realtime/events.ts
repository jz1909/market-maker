// defines the event types that can be sent to clients

export type GameEventType =
  | "player-joined"
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

export interface GameStartedData {
  roundId: string;
  roundIndex: number;
}

export interface RoundStartedData {
  roundId: string;
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
