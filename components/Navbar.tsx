"use client";

import { UserButton } from "@clerk/nextjs";
import { ReturnHomeButton } from "./ReturnHomeButton";

export function Navbar() {
  return (
    <div className="w-full flex items-center justify-between bg-white border-2 border-grey-200 shadow-[inset_0_-3px_5px_grey-200] p-3 pb-5">
      <div className="ml-3">
        <span className="font-bold text-2xl mr-4">Market Maker</span>
        <span className="italic text-gray-700">
          Make your next market on anything
        </span>
      </div>

      <div className="mr-5 flex items-center gap-6">
        <ReturnHomeButton />
        <UserButton />
      </div>
    </div>
  );
}
