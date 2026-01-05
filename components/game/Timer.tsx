"use client"

import {useState, useEffect, useCallback} from "react"

interface TimerProps{
    durationSeconds:number,
    isRunning: boolean,
    onTimeUp?: () => void
}

export function Timer ({durationSeconds, isRunning, onTimeUp}:TimerProps){

    const [remainingSeconds, setRemainingSeconds] = useState(durationSeconds)

    useEffect(()=>{
        setRemainingSeconds(durationSeconds)
    }, [durationSeconds])

    useEffect(()=>{
        if (!isRunning) return
        const interval = setInterval(()=>{
            setRemainingSeconds((prev) => {
                if (prev <=1) 
                {
                    clearInterval(interval)
                    onTimeUp?.()
                return 0
                }
            
            return prev-1; 
        })

        }, 1000)

        return () => clearInterval(interval)
    },[isRunning, onTimeUp])

    const minutes= Math.floor (remainingSeconds/60)
    const seconds = remainingSeconds % 60
    const formatted = `${minutes}: ${seconds.toString().padStart(2, "0")}`

    const isLow = remainingSeconds < 10


    return(<div className={`w-full text-center mb-4 text-2xl font-mono font-bold ${isLow? "text-red-600": "text-gray-700"}`}>
        {formatted}
    </div>)

}