import type { ReactNode } from "react";
import type { RagStatus } from "@/lib/alerts";

interface BadgeProps {
  children: ReactNode;
  status?: RagStatus | "neutral";
  className?: string;
}

const styles: Record<NonNullable<BadgeProps["status"]>, string> = {
  green:
    "text-emerald-700 bg-emerald-50/90 border border-emerald-200/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]",
  amber:
    "text-amber-700 bg-amber-50/90 border border-amber-200/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]",
  red: "text-red-700 bg-red-50/90 border border-red-200/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]",
  neutral:
    "text-slate-700 bg-white/60 border border-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]",
};

export function Badge({ children, status = "neutral", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold backdrop-blur-sm ${styles[status]} ${className}`}
    >
      {children}
    </span>
  );
}
