import { supabaseServer } from "../supabase/server";
import { GameEvent } from "./events";

export async function broadcastToGame(joinCode: string, event: GameEvent) {
  console.log(`[Broadcast] Sending ${event.type} to game:${joinCode}`);

  const channel = supabaseServer.channel(`game:${joinCode}`, {
    config: {
      broadcast: {
        self: true,
      },
    },
  });

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.log(`[Broadcast] Subscription timeout for game:${joinCode}`);
      reject(new Error("Channel subscription timeout"));
    }, 5000);

    channel.subscribe((status) => {
      console.log(`[Broadcast] Channel status: ${status}`);
      if (status === "SUBSCRIBED") {
        clearTimeout(timeout);
        resolve();
      }
    });
  });

  const result = await channel.send({
    type: "broadcast",
    event: "game-event",
    payload: event,
  });

  console.log(`[Broadcast] Send result:`, result);

  // Small delay to ensure message propagates before disconnecting
  await new Promise((resolve) => setTimeout(resolve, 100));

  await supabaseServer.removeChannel(channel);
  console.log(`[Broadcast] Channel removed for game:${joinCode}`);
}
