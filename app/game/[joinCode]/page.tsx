import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, games } from "@/lib/schema/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StartGameButton } from "@/components/StartGameButton";
import { QuestionDisplay } from "@/components/game/QuestionDisplay";
import { Timer } from "@/components/game/Timer";
import { Scoreboard } from "@/components/game/Scoreboard";
import { MakerPanel } from "@/components/game/MakerPanel";
import { TakerPanel } from "@/components/game/TakerPanel";

export default async function GamePage({params,}:{params: Promise <{joinCode:string}>}) {
    const {joinCode} = await params

    // auth
    const{userId:clerkUserId} = await auth()
    if (!clerkUserId){
        redirect("/")
    }

    // Map clerk user and get id
    const dbUser = await db.query.users.findFirst({
        where:eq(users.clerkUserId, clerkUserId)
    })

    if (!dbUser){
        redirect("/")
    }

    // Fetch game with maker taker info (joinCode is unique per schema)
    const game = await db.query.games.findFirst({
        where:eq(games.joinCode, joinCode),
        with:{maker:true, taker:true}
    })

    if (!game){
        return (<div className="min-h-screen flex items-center justify-center">
            <h1 className="text-2xl">Game Not Found</h1>
        </div>)
    }

    // auth participants
    const isMaker = game.makerUserId === dbUser.id
    const isTaker = game.takerUserId === dbUser.id

    if(!isMaker && !isTaker){
        redirect("/")
    }

    // derive page vars
    const bothPlayerPresent = game.makerUserId && game.takerUserId

    // render game page based on status aswell

    if (game.gameStatus === "LOBBY"){return(
        <div className="min-h-screen p-8">
            <header className="mb-8">
                <Link href="/" className="text-white hover:underline bg-blue-500 rounded-2xl p-3">
                Back to home
                </Link>
            </header>
            <main className="w-fill flex flex-col items-center justify-center">
                <h1 className="text-3xl font-bold mb-8"> Game Lobby </h1>

                {/* Join Code */}
                <div className="flex flex-col justify-center items-center bg-gray-100 rounded-2xl p-5">
                    <p className="text-xl">Share this code with your opponent:</p>
                    <p className="text-4xl font-mono tracking-widest mt-3">{game.joinCode}</p>
                </div>

                {/* player slots  */}
                <div className="grid grid-cols-2 gap-10 mb-8 mt-10">
                    {/* Maker */}
                    <div className={`p-4 rounded-lg border-2 ${isMaker ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}>
                        <p className="text-lg font-bold">Market Maker</p>
                        <p className="text-center">{game.maker?.displayName ?? "Unknown"}</p>
                        {isMaker && <div className="text-xs text-center"> (You) </div>}
                    </div>

                    {/* Taker */}
                    <div className={`p-4 rounded-lg border-2 ${isTaker ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}>
                        <p className="text-lg font-bold">Market Taker</p>
                        <p  className="text-center">{game.taker?.displayName ?? "Unknown"}</p>
                        {isTaker && <div className="text-xs text-center"> You </div>}
                    </div>
                </div>

                {/* Start game button, but only appears for maker and when both players are present */}
                <div>
                    <StartGameButton disabled={!bothPlayerPresent || isTaker} className={` hover:bg-gray-800 p-7 border-blue-50 border-4 
                        ${bothPlayerPresent ? "" : "bg-none bg-gray-100 border-gray text-gray-400 hover:bg-gray-100"}`} joinCode = {game.joinCode}/>
                </div>

                {/* Waiting for taker... */}
                {isTaker && (<div className="text-center text-gray-600 mt-12 text-lg">Waiting for host to start the game...</div>)}

                {/* Waiting for the maker */}
                {isMaker && !bothPlayerPresent && (<div className="text-center text-gray-600 mt-12 text-lg">Waiting for an opponent to join...</div>)}

            </main>
        </div>
    )}

    // Active or finished

    return (<div>
                <QuestionDisplay prompt= "what was Chinas population in 2024" unit="punds" roundIndex={1}/>
                <Timer durationSeconds={60} isRunning={false} onTimeUp={null}  />
                <Scoreboard makerName="Jason" takerName="John" makerWins={3} takerWins={3} currentRole="MAKER"/>
                {/* <MakerPanel joinCode="kkkkkk" roundId="wkdkw" currentTurn={2} isMyTurn={true} onQuoteSubmitted={null}/> */}
                <TakerPanel joinCode="kk" roundId="wdwdkw" currentTurn={5} currentQuote={{bid:5,ask:3}} isMyTurn={true} onTradeExecuted={null}/>
                {/* <TakerPanel joinCode="kk" roundId="wdwdkw" currentTurn={5} currentQuote={null} isMyTurn={true} onTradeExecuted={null}/> */}

            </div>)



}