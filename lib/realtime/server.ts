import { Server as HttpServer } from "http";
import { Server } from "socket.io";

export function createSocketServer(httpServer: HttpServer) {
    return new Server(httpServer, {
        cors:{origin:"*"},
    });
}