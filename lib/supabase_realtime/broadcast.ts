import { supabaseServer } from "../supabase/server";
import { GameEvent } from "./events";

export async function broadcastToGame(joinCode: string, event:GameEvent){
    const channel = supabaseServer.channel(`game:${joinCode}`)
    await channel.send({type:'broadcast', event:'game-event', payload:event})


}