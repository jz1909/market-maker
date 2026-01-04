"use client";

interface QuestionDisplayProps{
    prompt:string;
    unit: string | null;
    roundIndex: number;
}

export function QuestionDisplay({prompt, unit, roundIndex}:QuestionDisplayProps){
    return (<div className="bg-white border-2 border-gray-200 rounded-lg p-6 mb-4 m-5">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-bold text-gray-500">
                        Round {roundIndex + 1} of 3
                    </span>
                </div>
                <h2 className="text-2xl text-gray-800 mb-2">
                    Suppose a contract that pays out in 
                    <span className = "font-bold"> {unit} </span> 
                     of 
                     <span className="font-bold"> {prompt}</span> ...
                </h2>
                
            </div>)
}