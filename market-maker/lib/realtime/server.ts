import {Server} from "socket.io"

export function createSocketServer(httpServer:any){
    return new Server(httpServer, {
        cors:{origin:"*"},
    });
}