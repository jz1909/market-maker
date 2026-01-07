import { Trade, TradeSide } from "./types";

// This file calculates PnL for a single trade
// If taker buys at price P and the answer is A, then
// Taker PnL = (A-P) * quantitiy
// Maker PnL = (P-A) * quantity
// If taker sells
// Taker PnL = (P-A) * quantity
// Maker PnL = (A-P) * quantitiy

export function calculateTradePnL(
  trade: Trade,
  correctAnswer: number,
): { makerPnL: number; takerPnL: number } {
  let takerPnL: number;
  let makerPnL: number;
  const { side, price, quantity } = trade;

  if (side === "BUY") {
    takerPnL = (correctAnswer - price) * quantity;
    makerPnL = (price - correctAnswer) * quantity;
  } else {
    takerPnL = (price - correctAnswer) * quantity;
    makerPnL = (correctAnswer - price) * quantity;
  }

  return { makerPnL, takerPnL };
}

export function calculateRoundPnL(
  trades: Trade[],
  correctAnswer: number,
): { makerPnL: number; takerPnL: number } {
  let totalTakerPnL = 0;
  let totalMakerPnL = 0;

  for (const trade of trades) {
    const { makerPnL, takerPnL } = calculateTradePnL(trade, correctAnswer);
    totalTakerPnL += takerPnL;
    totalMakerPnL += makerPnL;
  }

  return { makerPnL: totalMakerPnL, takerPnL: totalTakerPnL };
}

export function calculateGameWin(
  roundResults: { makerPnL: number; takerPnL: number }[],
): { makerW: number; takerW: number } {
  let makerTotalW = 0;
  let takerTotalW = 0;

  for (const round of roundResults) {
    if (round.makerPnL > round.takerPnL) {
      makerTotalW += 1;
    } else if (round.takerPnL > round.makerPnL) {
      takerTotalW += 1;
    }
  }

  return { makerW: makerTotalW, takerW: takerTotalW };
}

export function isValidQuote(bid: number, ask: number): boolean {
  return bid < ask && bid >= 0 && ask >= 0;
}

export function calculateSpreadPercentage(bid: number, ask: number): number {
  const midpoint = (bid + ask) / 2;
  if (midpoint === 0) {
    return 0;
  }

  return ((ask - bid) / midpoint) * 100;
}

export function getTradePrice(bid: number, ask: number, side: TradeSide) {
  return side === "BUY" ? ask : bid;
}
