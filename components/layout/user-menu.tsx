"use client";

import { UserButton } from "@clerk/nextjs";

interface UserMenuProps {
  demoMode: boolean;
  userName?: string;
}

export function UserMenu({ demoMode, userName }: UserMenuProps) {
  if (demoMode) {
    return (
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-emerald/90 text-xs font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_8px_20px_rgba(32,201,151,0.25)] backdrop-blur-xl"
        title={`${userName ?? "Demo"} (demo mode — no Clerk)`}
      >
        D
      </div>
    );
  }

  return <UserButton />;
}
