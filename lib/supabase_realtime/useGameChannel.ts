"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../supabase/client";
import { GameEvent } from "./events";

interface PresenceData {
  userId: string;
  role: string;
  displayName: string;
  online_at: string;
}

export function useGameChannel(
  joinCode: string,
  userId?: string,
  role?: "maker" | "taker",
  displayName?: string | null,
) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<GameEvent | null>(null);
  const [presentUsers, setPresentUsers] = useState<string[]>([]);
  const previousUsersRef = useRef<string[]>([]);
  const isFirstSyncRef = useRef(true);

  useEffect(() => {
    const channel = supabase.channel(`game:${joinCode}`, {
      config: {
        presence: {
          key: userId || "anonymous",
        },
      },
    });

    channel.on("broadcast", { event: "game-event" }, (payload) => {
      console.log("Received broadcast event:", payload.payload);
      setLastEvent(payload.payload as GameEvent);
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const userIds = Object.keys(state);

      const newUsers = userIds.filter(
        (id) => !previousUsersRef.current.includes(id),
      );

      const goneUsers = previousUsersRef.current.filter(
        (id) => !userIds.includes(id),
      );

      for (const newUserId of newUsers) {
        if (newUserId !== userId) {
          const presences = state[newUserId] as PresenceData[] | undefined;
          const presenceData = presences?.[0];
          setLastEvent({
            type: "player-rejoined",
            timestamp: Date.now(),
            data: {
              userId: newUserId,
              role: presenceData?.role,
              displayName: presenceData?.displayName,
            },
          } as GameEvent);
        }
      }

      for (const goneUserId of goneUsers) {
        if (goneUserId !== userId) {
          setLastEvent({
            type: "player-left",
            timestamp: Date.now(),
            data: { userId: goneUserId },
          } as GameEvent);
        }
      }

      previousUsersRef.current = userIds;
      setPresentUsers(userIds);
    });

    channel.on("presence", { event: "join" }, ({ key, newPresences }) => {
      console.log("Presence join (debug):", key, newPresences);
    });

    channel.on("presence", { event: "leave" }, ({ key }) => {
      console.log("Presence leave (debug):", key);
    });

    channel.subscribe(async (status) => {
      setIsConnected(status === "SUBSCRIBED");

      if (status === "SUBSCRIBED" && userId) {
        await channel.track({
          userId,
          role,
          displayName,
          online_at: new Date().toISOString(),
        });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [joinCode, userId, role, displayName]);

  return { isConnected, lastEvent, presentUsers };
}
