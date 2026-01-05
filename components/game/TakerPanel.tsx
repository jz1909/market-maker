"use client"

import { useState } from "react";
import { Button } from "../ui/button";

interface TakerPanelProps{
    joinCode: string;
    roundId: string;
    currentTurn: number;
    currentQuote: {bid:number; ask:number} | null;
    isMyTurn:boolean;
    onTradeExecuted: () => void;
}

export function TakerPanel({joinCode, roundId, currentTurn, currentQuote, isMyTurn, onTradeExecuted}:TakerPanelProps){

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string|null>(null); 

    const handleTrade = async (side: "BUY" | "SELL" | null) => {

        setError(null)
        setLoading(true)

        try{
            const res = await fetch(`api/games/${joinCode}/rounds/${roundId}/trade`
                ,{method:"POST", 
                headers:{"Content-Type":"applications/json"}, 
                body: JSON.stringify({side})}
            )

            const data = await res.json()

            if (!res.ok){
                setError(data.error || "Failed to execute trade")
                return
            }

            onTradeExecuted?.()

        } catch (err){
            setError("Something went wrong here")
        } finally {
            setLoading(false)
        }
    }

 
    if(!currentQuote){
        return(
        <div className="bg-green-50 border-2 border-green-200 rounded lg p-4 m-10 flex flex-col items-center">
            <h3 className="font-semibold text-2xl text-green-900 mb-3">
                Turn {currentTurn + 1} of 3
            </h3>
            <p className="text-gray-600 text-2xl font-bold m-10">
                Waiting for maker to submit a quote...
            </p>
        </div>
    )
    }

    return (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-20 m-10 flex flex-col items-center">
            <h3 className="font-semibold text-2xl text-green-900 mb-3">
                Turn {currentTurn + 1} of 3
            </h3>

            <div className=" mt-5 flex justify-center gap-8 mb-4">
                <div className="p-5 rounded-lg border-2 bg-red-50 border-red-100 text-center">
                    <span className="mb-5 block text-2xl text-gray-600">Quoted Bid</span>
                    <span className="text-2xl font-bold">${currentQuote.bid}</span>
                </div>
                <div className="p-5 rounded-lg border-2 bg-blue-50 border-blue-100 text-center">
                    <span className="mb-5 block text-2xl text-gray-600">Quoted Ask</span>
                    <span className="text-2xl font-bold">${currentQuote.ask}</span>
                </div>
            </div>

            {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

            <div className="flex gap-18 m-5">
                <Button onClick={()=> handleTrade("SELL")} disabled={!isMyTurn || loading}
                    className="bg-none bg-red-600 hover:bg-red-500 text-xl font-bold">
                    SELL @ ${currentQuote.bid}
                </Button>

                <Button onClick={()=> handleTrade("BUY")} disabled={!isMyTurn || loading}
                    className="bg-none bg-blue-600 hover:bg-blue-500 text-xl font-bold">
                    BUY @ ${currentQuote.ask}
                </Button>
            </div>

            <div>
                <Button onClick={()=> handleTrade(null)}  disabled={!isMyTurn || loading}
                    className="bg-none bg-gray-600 hover:bg-gray-500 text-xl font-bold">
                    Pass
                </Button>
            </div>

        </div>
    )
}