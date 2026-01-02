  import { auth } from "@clerk/nextjs/server";
  import { db } from "@/lib/db";
  import { users, games } from "@/lib/schema/schema";
  import { eq } from "drizzle-orm";
  import { NextResponse } from "next/server";

  export async function GET(req:Request, {params}:{params:Promise<{joinCode:string}>}){

    const {userId:clerkUserId} = await auth()
    if (!clerkUserId){
        return NextResponse.json({error:"Not Authorized"}, {status: 401})
    }

    const {joinCode} = await params;

    const dbUser = await db.query.users.findFirst({where:eq(users.clerkUserId, clerkUserId)})
    if (!dbUser){
        return NextResponse.json({error: "User not found"}, {status:404})
    }

    const game = await db.query.games.findFirst({where: eq(games.joinCode, joinCode), with:{maker:true, taker:true}})
    if (!game){
        return NextResponse.json({error: "Game not found"}, {status:404})
    }

    if (game.makerUserId !== dbUser.id && game.takerUserId !== dbUser.id){
        return NextResponse.json({error: "Not a participant in this game"}, {status:403})
    }

    return NextResponse.json({game});

  }