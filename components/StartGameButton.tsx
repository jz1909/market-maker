"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StartGameButtonProps {
  joinCode: string;
  className?: string;
  disabled?: boolean;
  onGameStarted?: (
    roundId: string,
    questionPrompt: string,
    questionUnit: string | null,
  ) => void;
}

export function StartGameButton({
  joinCode,
  className,
  disabled,
  onGameStarted,
}: StartGameButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);

    try {
      const res = await fetch(`/api/games/${joinCode}/start`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to start game");
        return;
      }

      if (onGameStarted && data.roundId) {
        onGameStarted(data.roundId, data.questionPrompt, data.questionUnit);
      }

      router.refresh();
    } catch {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      disabled={disabled || loading}
      className={cn(
        "px-8 py-3 font-bold rounded-lg",
        loading && "cursor-wait",
        className,
      )}
      onClick={handleStart}
    >
      {loading ? "Starting..." : "Start Game"}
    </Button>
  );
}
