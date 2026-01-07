"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function CreateGameButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/games", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to create game");
        return;
      }

      router.push(`/game/${data.joinCode}`);
    } catch {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCreate}
      disabled={loading}
      className="font-bold mt-2 w-[60%] h-[3vh] p-5"
    >
      {loading ? "Creating..." : "Create Game"}
    </Button>
  );
}
