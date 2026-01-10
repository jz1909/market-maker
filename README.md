# Market Making Game

This is a two-player market-making game inspired by Protobowl and trading mechanics

## Overview

Each game consists of **two players**:
- **Maker** – sets the market (bid/ask prices)
- **Taker** – chooses whether to trade against the market

The goal is to make better probabilistic judgments and pricing decisions over multiple rounds given trivia-like questions.

---

## How the Game Works

1. **Create or Join a Game**
   - One player creates a game and receives a join code.
   - A second player joins using that code.

2. **Roles Are Assigned**
   - One player becomes the **Maker**
   - The other becomes the **Taker**

3. **Rounds**
   - Each round is based on a numerical question (e.g. estimating a real-world quantity).
   - The **Maker** submits a bid and ask price for a contract.
   - The **Taker** can:
     - Buy at the ask
     - Sell at the bid
     - Or choose not to trade

4. **Scoring**
   - Trades generate profit or loss based on the true answer.
   - After all rounds are completed, the final answer is revealed and scores are calculated.

5. **Winner**
   - The player with the higher total PnL at the end of the game wins.

---

## Notes

-Note that the current pool of questions is not very diverse and pretty unplayable, because I've yet to find a huge source of data with numerical trivia questions. However, **the question set is going to be expanded.**  
- Game mechanics and UI may continue to evolve as the project develops.

---

## Status

This project is under active development.
