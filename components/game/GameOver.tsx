"use client"

import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

interface GameOverProps{
    makerName:string;
    takerName:string;
    makerWins:number;
    takerWins:number;
    currentRoles: "MAKER"|"TAKER";
    winnerId: string | null;
    currentUserId:string;
}

export function GameOver({makerName, takerName, makerWins, takerWins, currentRoles, winnerId, currentUserId}:GameOverProps){
    const router = useRouter();

    const iWon = winnerId === currentUserId
    const isTie = winnerId === null

    const winnerName = makerWins > takerWins ? makerName : takerWins > makerWins? takerName : null

    return(
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="flex flex-col items-center justify-center bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
                <h1 className="text-3xl font-bold mb-8">Game Over!</h1>

                <div className="mb-8">{isTie?
                (<p className="text-2xl text-gray-600">It's a tie!</p>):
                
                (
                <>
                    <span className="text-xl text-gray-600 mb-2">Winner&nbsp;:&nbsp;</span> 
                    <span className="text-3xl font-bold text-green-600">{winnerName}</span>
                </>
                )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className={`p-6 rounded-lg flex flex-col items-center ${makerWins > takerWins ? "bg-green-100 border-2 border-green-500":"bg-gray-100"}`}>
                        <p className="text-lg text-gray-600">{makerName}</p>
                        <div>
                            <span className="font-bold">{makerWins}&nbsp;</span>
                            <span>rounds won</span>
                        </div>
                    </div>

                    <div className={`p-6 rounded-lg flex flex-col items-center ${takerWins > makerWins ? "bg-green-100 border-2 border-green-500":"bg-gray-100"}`}>
                        <p className="text-lg text-gray-600">{takerName}</p>
                        <div>
                            <span className="font-bold">{takerWins}&nbsp;</span>
                            <span>rounds won</span>
                        </div>
                    </div>
                    
                </div>

                <p className="text-xl mb-6">{iWon ?"Congratulations, you won!" : isTie? "Good game" : "Better luck next time!"}</p>

                <Button className= "p-5 font-bold" onClick={() => router.push("/")}>Go back home</Button>



            </div>

            

        </div>
    )


}