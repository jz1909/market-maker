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
          <div className="flex flex-col min-h-screen flex justify-center items-start bg-linear-to-r from-blue-500 to-green-500 p-20">
            <div>
              <h1 className="text-5xl font-bold text-white">
                Welcome to Market-Maker
              </h1>
              <Separator className="my-4 bg-white" />
            </div>
            <div className="text-2xl text-white">
              Market-Maker is a hybrid game that combines the elements of quiz
              bowl and market-making. Market-maker is a real-time multiplayer
              trading game that allows you to be the maker or taker of a
              contract in the form of a trivia question. It includes over
              thousands of questions and more are constantly being added.
            </div>
            <div className="text-2xl mt-5 text-white">
              If you have any particular questions, feel free to reach out to
              jsh27335@gmail.com for any help.
            </div>
            <SignInButton>
              <Button className="bg-none bg-white opacity-30 font-bold mt-5 text-black hover:opacity-20 transition-opacity p-5">
                Sign In
              </Button>
            </SignInButton>
          </div>
        </SignedOut>
        <SignedIn>
          <NavbarHome />

          <div className="flex flex-col items-center gap-4   ">
            <div className="flex flex-col bg-gray-100 outline-8 outline-blue-300 shadow-2xl shadow-blue-200 justify-center w-[50vw] h-[40vh] -translate-y-10 items-center gap-8  p-25 rounded-lg">
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
            <h2 className="text-4xl font-semibold mb-10 w-full text-center">
              Previous games
            </h2>
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
