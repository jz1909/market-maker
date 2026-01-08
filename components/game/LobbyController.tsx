"use client"

  import { useEffect, useState } from "react"
  import { useRouter } from "next/navigation"
  import { useGameEvents } from "@/lib/realtime/useGameEvents"
  import { StartGameButton } from "@/components/StartGameButton"
  import Link from "next/link"

  interface LobbyControllerProps {
    joinCode: string
    game: {
      id: string
      makerUserId: string
      takerUserId: string | null
      makerName: string
      takerName: string | null
    }
    currentUserId: string
  }

  export function LobbyController({
    joinCode,
    game,
    currentUserId,
  }: LobbyControllerProps) {
    const router = useRouter()

    const isMaker = game.makerUserId === currentUserId
    const isTaker = game.takerUserId === currentUserId

    // State that can update via SSE
    const [takerName, setTakerName] = useState(game.takerName)
    const [takerId, setTakerId] = useState(game.takerUserId)

    const bothPlayersPresent = game.makerUserId && takerId

    // SSE subscription
    const { isConnected, lastEvent } = useGameEvents(joinCode)

    useEffect(() => {
      if (!lastEvent) return

      switch (lastEvent.type) {
        case "player-joined": {
          const data = lastEvent.data as { takerName: string; takerId:
  string }
          setTakerName(data.takerName)
          setTakerId(data.takerId)
          break
        }

        case "game-started": {
          // Refresh the page to load GameController with active game
          router.refresh()
          break
        }
      }
    }, [lastEvent, router])

    return (
      <div className="min-h-screen p-8">
        <header className="mb-8">
          <Link
            href="/"
            className="text-white hover:underline bg-blue-500 rounded-2xl      
  p-3"
          >
            Back to home
          </Link>
        </header>
        <main className="w-fill flex flex-col items-center justify-center">    
          <h1 className="text-3xl font-bold mb-8">Game Lobby</h1>

          {/* Join Code */}
          <div className="flex flex-col justify-center items-center
  bg-gray-100 rounded-2xl p-5">
            <p className="text-xl">Share this code with your opponent:</p>     
            <p className="text-4xl font-mono tracking-widest
  mt-3">{joinCode}</p>
          </div>

          {/* Player slots */}
          <div className="grid grid-cols-2 gap-10 mb-8 mt-10">
            {/* Maker */}
            <div
              className={`p-4 rounded-lg border-2 ${isMaker ?
  "border-blue-500 bg-blue-50" : "border-gray-300"}`}
            >
              <p className="text-lg font-bold">Market Maker</p>
              <p className="text-center">{game.makerName}</p>
              {isMaker && <div className="text-xs text-center">(You)</div>}    
            </div>

            {/* Taker */}
            <div
              className={`p-4 rounded-lg border-2 ${isTaker ?
  "border-blue-500 bg-blue-50" : "border-gray-300"}`}
            >
              <p className="text-lg font-bold">Market Taker</p>
              <p className="text-center">{takerName ?? "Waiting..."}</p>       
              {isTaker && <div className="text-xs text-center">(You)</div>}    
            </div>
          </div>

          {/* Start game button */}
          <div>
            <StartGameButton
              disabled={!bothPlayersPresent || isTaker}
              className={`hover:bg-gray-800 p-7 border-blue-50 border-4${bothPlayersPresent} ? "" : "bg-none bg-gray-100
  border-gray text-gray-400 hover:bg-gray-100"}`}
              joinCode={joinCode}
            />
          </div>

          {/* Status messages */}
          {isTaker && (
            <div className="text-center text-gray-600 mt-12 text-lg">
              Waiting for host to start the game...
            </div>
          )}

          {isMaker && !bothPlayersPresent && (
            <div className="text-center text-gray-600 mt-12 text-lg">
              Waiting for an opponent to join...
            </div>
          )}

          {!isConnected && (
            <p className="text-yellow-600 text-sm mt-4">Connecting to
  server...</p>
          )}
        </main>
      </div>
    )
  }
