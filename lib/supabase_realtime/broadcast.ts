import { GameEvent } from "./events";

// Server-side broadcast doesn't work in serverless (Vercel) because
// WebSocket connections can't be maintained. This is now a no-op.
// Clients broadcast directly using broadcastFromClient instead.
export async function broadcastToGame(joinCode: string, event: GameEvent) {
  // No-op - server can't maintain WebSocket in serverless environment
  console.log(`[Broadcast] Server broadcast disabled for ${event.type}`);
}
