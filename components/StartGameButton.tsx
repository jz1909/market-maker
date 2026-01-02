"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function StartGameButton({joinCode, className, disabled}:{joinCode:string, className?: string, disabled?:boolean}){
    const router = useRouter()
    const [loading, setLoading] = useState(false);

    const handleStart = async () => {
        setLoading(true)

        try{
            const res = await fetch(`/api/games/${joinCode}/start`, {method:"POST"})
            const data = await res.json()

            if(!res.ok){
                alert(data.error || "Failed to start game")
                return
            }

            router.refresh()
        } catch {
            alert("Something went wrong")

        } finally {
            setLoading(false)
        }
    }

    return(<Button disabled={disabled || loading} className={cn("px-8 py-3 font-bold rounded-lg", className)} onClick={handleStart}>
        {loading?"Starting...":"Start Game"}</Button>)
}   