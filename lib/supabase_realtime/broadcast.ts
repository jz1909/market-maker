import { supabaseServer } from "../supabase/server";
import { GameEvent } from "./events";

export async function broadcastToGame(joinCode: string, event: GameEvent) {
  const channel = supabaseServer.channel(`game:${joinCode}`, {
    config: {
      broadcast: {
        self: true,
      },
    },
  });

  await new Promise<void>((resolve) => {
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        resolve();
      }
    });
  });

  await channel.send({
    type: "broadcast",
    event: "game-event",
    payload: event,
  });

  await supabaseServer.removeChannel(channel);
}
