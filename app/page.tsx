import { currentUser } from "@clerk/nextjs/server";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { users, games } from "@/lib/schema/schema";
import { eq, or } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { CreateGameButton } from "@/components/CreateGameButton";
import { JoinGameForm } from "@/components/JoinGameForm";
import Link from "next/link";
import { NavbarHome } from "@/components/NavbarHome";
import { Separator } from "@/components/ui/separator";

type DbUser = typeof users.$inferSelect;
type GameWithRelations = typeof games.$inferSelect & {
  maker: DbUser | null;
  taker: DbUser | null;
};

export default async function Home() {
  const user = await currentUser();
  let dbUser: DbUser | undefined;
  let userGames: GameWithRelations[] = [];
  if (user) {
    dbUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, user.id),
    });

    if (dbUser) {
      userGames = await db.query.games.findMany({
        where: or(
          eq(games.makerUserId, dbUser.id),
          eq(games.takerUserId, dbUser.id),
        ),
        orderBy: (games, { desc }) => [desc(games.createdAt)],
        with: { maker: true, taker: true },
      });
    }
  }

  return (
    <div className="min-h-screen ">
      <main>
        <SignedOut>
          <div className=" min-h-screen flex justify-center items-center bg-gray-500">
            <div className="w-[40vw] aspect-square rounded-xl border-[15px] border-gray-200 shadow-2xl bg-gray-100 flex flex-col justify-between p-6">
              <div>
                <h1 className="text-4xl font-bold">Welcome to Market-Maker</h1>
                <Separator className="my-4 bg-gray-400"/>
              </div>
              <div className="text-3xl">
                Market-Maker is a hybrid game that combines the elements of quiz
                bowl and market-making. Market-maker is a real-time multiplayer
                trading game that allows you to be the maker or taker of a
                contract in the form of a trivia question. It includes over
                thousands of questions and more are constantly being added.
              </div>
              <div className="text-3xl">
                If you have any particular questions, feel free to reach out to
                jsh27335@gmail.com for any help.
              </div>
              <SignInButton>
                <Button className="bg-blue-500 font-bold mt-2">Sign In</Button>
              </SignInButton>
            </div>
          </div>
        </SignedOut>
        <SignedIn>
          <NavbarHome />

          <div className="flex flex-col items-center gap-4 mb-1 p-10  ">
            <div className="flex flex-col bg-gray-100 outline-8 outline-blue-300 shadow-2xl shadow-blue-200 justify-center w-[50vw] h-[50vh] -translate-y-25 items-center gap-20  p-25 rounded-lg">
              <div className="flex items-center justify-center w-full">
                <CreateGameButton />
              </div>

              <div className="text-4xl font-extrabold text-blue-400">or</div>

              <div className="">
                <JoinGameForm />
              </div>
            </div>
          </div>

          <section className="mb-200">
            <h2 className="text-4xl font-semibold mb-10 w-full text-center">Previous games</h2>
            {userGames.length === 0 ? (
              <p className="text-xl text-gray-500">
                No games yet. Create or join one to start!
              </p>
            ) : (
              <ul className="space-y-6 flex flex-col items-center justify-center">
                {userGames.map((game) => (
                  <li
                    key={game.id}
                    className="w-[40vw] p-4 border-[3px] border-gray-500 rounded flex justify-between items-center"
                  >
                    <span className="font-mono text-sm">{game.joinCode}</span>
                    <span className="ml-4 text-sm text-gray-500">
                      {game.gameStatus}
                    </span>
                    <span className="ml-4">
                      vs{" "}
                      {game.makerUserId === dbUser?.id
                        ? (game.taker?.displayName ?? "Waiting...")
                        : (game.maker?.displayName ?? "Waiting...")}
                    </span>
                    <Link href={`/game/${game.joinCode}`}>Open</Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </SignedIn>
      </main>
    </div>
  );
}
