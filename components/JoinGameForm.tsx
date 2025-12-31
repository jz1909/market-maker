"use client"
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function JoinGameForm(){

    const router = useRouter()
    const [loading, setLoading] = useState(false);
    const [code, setCode] = useState("");

    const handleJoin = async () => {
        if (!code.trim()){
            alert("Please enter a join code")
            return;
        }

        setLoading(true)

        try{
            const res = await fetch("/api/games/join", 
            {method:"POST", headers: {"Content-Type": "application/json"}, 
            body:JSON.stringify({joinCode:code})})

            const data = await res.json();

            if(!res.ok){
                alert(data.error || "Failed to join game")
                return;
            }

            router.push(`/game/${data.gameId}`)

        } catch (error) {
            alert("Something went wrong")

        } finally {
            setLoading(false)
        }
    }

    return (<div className="flex justify-center items-center gap-4">
        <input type="text" value={code} onChange={(e) => setCode(e.target.value)}
         placeholder="Enter Join Code" className="px-3 py-2 border-4 border-gray-400 rounded-lg w-[20vw]" 
         maxLength={6}/>
        <Button className= "font-bold" onClick={handleJoin} disabled={loading}>
            {loading? "Joining...":"Join"}
        </Button>
         
        </div>
        )
}