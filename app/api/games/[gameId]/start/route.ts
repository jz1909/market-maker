import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, games, rounds, questions } from "@/lib/schema/schema";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST (req: Request, {params}:{params:Promise<{gameId: string}>}){

    const {gameId} = await params

    // Check auth

    const {userId:clerkUserId} = await auth()

    if (!clerkUserId){
        return NextResponse.json({error:"Not authorized"},{status:401})
    }


    // Get UUID

    const dbUser = db.query.users.findFirst({
        where:eq(users.clerkUserId, clerkUserId)
    })

    if (!dbUser){
        return NextResponse.json({error:"User not in database"}, {status:404})
    }

    // fetch game

    const game = db.query.games.findFirst({
        where:eq(games.id, gameId)
    })







}