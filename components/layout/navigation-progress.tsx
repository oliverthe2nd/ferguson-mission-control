"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavigationProgress() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<"idle" | "loading" | "finishing">("idle");

  useEffect(() => {
    setPhase("loading");
    const finishTimer = window.setTimeout(() => setPhase("finishing"), 350);
    const idleTimer = window.setTimeout(() => setPhase("idle"), 900);

    return () => {
      window.clearTimeout(finishTimer);
      window.clearTimeout(idleTimer);
    };
  }, [pathname]);

  if (phase === "idle") return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[3px] overflow-hidden"
      aria-hidden
    >
      <div
        className={cn(
          "nav-progress-bar h-full origin-left bg-gradient-to-r from-emerald-400 via-emerald-500 to-orange-400 shadow-[0_0_12px_rgba(32,201,151,0.55)] transition-[transform,opacity] duration-500 ease-out",
          phase === "loading" && "nav-progress-active",
          phase === "finishing" && "scale-x-100 opacity-0",
        )}
      />
    </div>
  );
}
