import { users } from "@/lib/schema/schema";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {headers} from "next/headers";
import {Webhook} from "svix";

export async function POST(req:Request){
    const secret = process.env.CLERK_WEBHOOK_SECRET
   

    if (!secret) {
        return new Response("Missing CLERK_WEBHOOK_SECRET", {status:500});
    }

    if(!process.env.DATABASE_URL){
        return new Response("Missing DATABASE_URL", {status:500})
    }

    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle(sql);

    const payload = await req.text();

    const h = await headers();
    const svix_id = h.get("svix-id")
    const svix_timestamp = h.get("svix-timestamp")
    const svix_signature = h.get("svix-signature")

    if (!svix_id||!svix_timestamp||!svix_signature){
        console.error("Missing svix headers:", { svix_id, svix_timestamp, svix_signature });
        return new Response("Missing svix elements", {status:400})
    }

    // verify webhooks request to prevent payload attack

    interface ClerkWebhookPayload {
        type: string;
        data: {
            id: string;
            email_addresses?: Array<{ id: string; email_address: string }>;
            primary_email_address_id?: string;
            username?: string;
            first_name?: string;
        };
    }

    const wh = new Webhook(secret);
    let msg: ClerkWebhookPayload;
    try{
        msg = wh.verify(payload, {"svix-id":svix_id, "svix-timestamp":svix_timestamp, "svix-signature":svix_signature}) as ClerkWebhookPayload;
    } catch (err) {
        console.error("Signature verification failed:", err);
        return new Response("Invalid signature", {status:400});
    }

    const eventType = msg.type;


    if(eventType == "user.created"){
        const user = msg.data;
        const primaryEmail = user.email_addresses?.find((e) => e.id === user.primary_email_address_id)?.email_address ?? null;
        const clerkUserId = user.id;
        const displayName = user.username ?? user.first_name ?? null;

        try{await db.insert(users).values({
            email: primaryEmail,
            clerkUserId: clerkUserId,
            displayName: displayName,
        })} catch (err) {
            console.error("DB insert failed:", err);
            return new Response("DB upwrite failed", {status:400})
        }
        

        return new Response ("OK", {status:200})
    }

    return new Response ("OK" , {status:200})



}