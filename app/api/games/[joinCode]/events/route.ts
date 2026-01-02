import { auth } from "@clerk/nextjs/server";
import { addClient, removeClient } from "@/lib/realtime/eventEmitter";

export const dynamic = "force-dynamic"

export async function GET(req:Request, {params}:{params:Promise<{joinCode:string}>}){
    const{joinCode} = await params
    const {userId} = await auth()

    if(!userId){
        return new Response("Unauthorized", {status:401})
    }

    let controllerRef: ReadableStreamDefaultController | null = null
    const stream = new ReadableStream({start(controller) {
        controllerRef = controller;
        addClient(joinCode, controller)
        
        const encoder = new TextEncoder;
        controller.enqueue(encoder.encode(`data:{"type":"connected"}\n\n`))
    },
    cancel(){
        if(controllerRef){
            removeClient(joinCode, controllerRef)
        }
    }})

    return new Response(stream, {headers:{"Content-Type":"text/event-stream",
        "Cache-Control": "no-cache, no-transform", 
        "Connection" : "keep-alive"
    }})
}