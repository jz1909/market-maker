// Manages SSE connections and broadcasts live events to players

import { GameEvent } from "./events";

const gameConnections = new Map<string, Set<ReadableStreamDefaultController>>()

export function addClient(joinCode:string, controller:ReadableStreamDefaultController):void{

    if (!gameConnections.has(joinCode)){
        gameConnections.set(joinCode, new Set())
    }
    gameConnections.get(joinCode)!.add(controller)
    console.log(`Client connected to game ${joinCode}. Total clients:
        ${gameConnections.get(joinCode)!.size}`)
}





export function removeClient(joinCode:string, controller: ReadableStreamDefaultController):void{
    const clients = gameConnections.get(joinCode)

    if(clients){
        clients.delete(controller)
        console.log(`Client disconnected from game ${joinCode}. Remaining: ${clients.size}`)
        if (clients.size === 0 ){
            gameConnections.delete(joinCode);
        }
        
    }

}



export function broadcastToGame(joinCode:string, event:GameEvent):void{
    const clients = gameConnections.get(joinCode)
    if (!clients || clients.size === 0) {
        console.log(`No clients connected to game ${joinCode}`)
        return
    }

    const message = `data: ${JSON.stringify(event)}\n\n`
    const encoder = new TextEncoder()
    const encoded = encoder.encode(message)

    for (const controller of clients){
        try{
            controller.enqueue(encoded);
        } catch(error){
            console.error("Error sending to client", error)
            clients.delete(controller)
        }

    }



}


