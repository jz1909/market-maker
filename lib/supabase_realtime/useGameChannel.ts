"use client"

import { useEffect, useState } from "react"
import { supabase } from "../supabase/client"
import { GameEvent } from "./events"

export function useGameChannel(
    joinCode: string,
    userId?: string,
    role?: "maker" | "taker",
    displayName?: string
) {
    const [isConnected, setIsConnected] = useState(false)
    const [lastEvent, setLastEvent] = useState<GameEvent | null>(null)
    const [presentUsers, setPresentUsers] = useState<string[]>([])

    useEffect(() => {
        const channel = supabase.channel(`game:${joinCode}`, {
            config: {
                presence: {
                    key: userId || "anonymous",
                },
            },
        })

        channel.on("broadcast", { event: "game-event" }, (payload) => {
            setLastEvent(payload.payload as GameEvent)
        })

        channel.on("presence", { event: "sync" }, () => {
            const state = channel.presenceState()
            const userIds = Object.keys(state)
            setPresentUsers(userIds)
        })

        channel.on("presence", { event: "join" }, ({ key, newPresences }) => {
            console.log("User joined:", key, newPresences)
            const presenceData = newPresences[0] as { userId: string; role: string; displayName: string } | undefined
            setLastEvent({
                type: "player-rejoined",
                timestamp: Date.now(),
                data: {
                    userId: key,
                    role: presenceData?.role,
                    displayName: presenceData?.displayName
                },
            } as GameEvent)
        })

        channel.on("presence", { event: "leave" }, ({ key }) => {
            console.log("User left:", key)
            setLastEvent({
                type: "player-left",
                timestamp: Date.now(),
                data: { userId: key },
            } as GameEvent)
        })

        channel.subscribe(async (status) => {
            setIsConnected(status === "SUBSCRIBED")

            if (status === "SUBSCRIBED" && userId) {
                await channel.track({
                    userId,
                    role,
                    displayName,
                    online_at: new Date().toISOString(),
                })
            }
        })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [joinCode, userId, role, displayName])

    return { isConnected, lastEvent, presentUsers }
}