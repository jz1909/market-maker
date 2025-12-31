// Player and game ENUMS

export type PlayerRole = "MAKER" | "TAKER"
export type RoundStatus = "PENDING" | "LIVE" | "ENDED" | "SETTLED"
export type TradeSide = "BUY" | "SELL"

// quotes & trading

export interface Quote{
    bid:number,
    ask:number,
    spread:number;
}

export interface Trade {
    side: TradeSide,
    price: number,
    quantity: number;
}

// round result

export interface RoundResult{
    questionPrompt: string,
    correctAnswer: number,
    makerQuote: Quote | null,
    takerTrade: Trade | null,
    makerPnL: number,
    takerPnL: number;
}

// Game Configs

// settings
export interface GameConfig{
    totalRounds:number,
    roundDurationSeconds:number,
    defaultQuantity:number;
}

// default settings set
export const DEFAULT_GAME_CONFIG: GameConfig = {
    totalRounds:5,
    roundDurationSeconds:40,
    defaultQuantity:1
}
