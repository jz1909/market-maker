"use client";

import { UserButton } from "@clerk/nextjs";

export function NavbarHome() {
  return (
    <div className=" bg-linear-to-r from-indigo-800 via-blue-200 via-indigo-800 to-blue-400 w-full h-[35vh] flex flex-col items-start justify-between shadow-[inset_0_-3px_5px_gray-200] p-3 pb-5">
      <div className="flex items-center justify-between w-full mt-5">
        <div className="ml-3">
          <span className="font-bold text-2xl mr-4 text-white">
            Market Maker
          </span>
          <span className="italic text-gray-200">
            Make your next market on anything
          </span>
        </div>

        <div className="mr-5 flex items-center gap-6">
          <UserButton />
        </div>
      </div>

      <div className="mt-auto mb-auto -translate-y-7 text-4xl font-bold text-white text-center w-full">
        Market Making QB Game
      </div>
    </div>
  );
}
