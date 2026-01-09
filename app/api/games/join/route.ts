import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, games } from "@/lib/schema/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import {
  createGameEvent,
  PlayerJoinedData,
} from "@/lib/supabase_realtime/events";
import { broadcastToGame } from "@/lib/supabase_realtime/broadcast";

export async function POST(req: Request) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // parse req body
  const body = await req.json();
  const { joinCode } = body;

  if (!joinCode || typeof joinCode !== "string") {
    return NextResponse.json(
      { error: "Join code is invalid" },
      { status: 400 },
    );
  }

  // get user uuid
  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
  });

  if (!dbUser) {
    return NextResponse.json(
      { error: "User not found in database" },
      { status: 404 },
    );
  }

  // find the game
  const game = await db.query.games.findFirst({
    where: and(eq(games.joinCode, joinCode), eq(games.gameStatus, "LOBBY")),
  });

  if (!game) {
    return NextResponse.json(
      { error: "Game not found or room is already full" },
      { status: 404 },
    );
  }

  if (game.makerUserId === dbUser.id) {
    return NextResponse.json(
      { error: "You can't join your own game" },
      { status: 400 },
    );
  }

  if (game.takerUserId) {
    return NextResponse.json(
      { error: "Game is already full" },
      { status: 400 },
    );
  }

  await db
    .update(games)
    .set({ takerUserId: dbUser.id })
    .where(eq(games.id, game.id));

  // Broadcast to maker that taker has joined
  const playerJoinedData: PlayerJoinedData = {
    takerName: dbUser.displayName ?? "Unknown",
    takerId: dbUser.id,
  };
  broadcastToGame(
    game.joinCode,
    createGameEvent("player-joined", playerJoinedData),
  );

  return NextResponse.json({ gameId: game.id, joinCode: game.joinCode });
}
