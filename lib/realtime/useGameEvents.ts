"use client";
// React hook to listen to SSE Events and update UI accordingly
// Workflow goes like this

/*
One player does an action
button calls api
api then calls game engine to handle logic and db stuff
api then calls broadcast to game
then sends event to each connected client
connected client receives event
then eventSource.onMessage fires
setLastEvent(data) is called
changes lastEvent state
React sees state changed
then useEffect in gameeffect sees that too, which then makes a change  

*/

import { useEffect, useState, useRef } from "react";
import { GameEvent, GameEventType } from "./events";

export function useGameEvents(joinCode: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<GameEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const eventSource = new EventSource(`/api/games/${joinCode}/events`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log("SSE connected");
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as GameEvent;
        console.log("SSE event received", data);
        setLastEvent(data);
      } catch (error) {
        console.error("Failed to parse SSE event:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.log("SSE error: ", error);
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [joinCode]);

  return { isConnected, lastEvent };
}
