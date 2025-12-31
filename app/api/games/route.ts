  import { auth } from "@clerk/nextjs/server";
  import { db } from "@/lib/db";
  import { users, games } from "@/lib/schema/schema";
  import { eq } from "drizzle-orm";
  import { NextResponse } from "next/server";


  function generateJoinCode(): string{

    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    let code = "";
    for (let i = 0; i<6; i++){
        code+= chars.charAt(Math.floor(Math.random()*chars.length))
    }

    return code

  }

export async function POST() {
    // check auth
    const {userId:clerkUserId} = await auth()
    if (!clerkUserId){
        return NextResponse.json({error: "Unauthorized"}, {status:401});
    }

    // get uuid
    const dbUser = await db.query.users.findFirst({where: eq(users.clerkUserId, clerkUserId)})
    if(!dbUser){
        return NextResponse.json({error:"User not in database"}, {status:404})
    }

    // get join code
    let joinCode = generateJoinCode()
    let attempts = 0
    while(attempts<5){
        const existing = await db.query.games.findFirst({where: eq(games.joinCode, joinCode)});
        if (!existing) break;
        joinCode = generateJoinCode();
        attempts++
    }

    if (!joinCode){
        return NextResponse.json({error:"No join code available"}, {status:409})
    }

    const [newGame] = await db.insert(games).values({joinCode:joinCode, makerUserId:dbUser.id, gameStatus:"LOBBY"}).returning();
    return NextResponse.json({gameId:newGame?.id, joinCode: newGame?.joinCode})


}