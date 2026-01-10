"use client";

import Link from "next/link";
import { Button } from "./ui/button";

export function ReturnHomeButton() {
  return (
    <Button className="p-5 !text-grey-500 font-bold">
      <Link
        href="/"
      >
        Back to home
      </Link>
    </Button>
  );
}
