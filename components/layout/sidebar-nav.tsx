"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  BadgeDollarSign,
  BriefcaseBusiness,
  Building2,
  FileCheck2,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  UploadCloud,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS: {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/sales", label: "Sales & Marketing", icon: Megaphone },
  { href: "/dashboard/enrolment", label: "Enrolment & Finance", icon: GraduationCap },
  { href: "/dashboard/visa", label: "Visa Team", icon: FileCheck2 },
  { href: "/dashboard/accounts", label: "Accounts", icon: BadgeDollarSign },
  { href: "/dashboard/placement", label: "Job Placement", icon: BriefcaseBusiness },
  { href: "/dashboard/centres", label: "Study Centres", icon: Building2 },
  { href: "/upload", label: "Upload", icon: UploadCloud, adminOnly: true },
  { href: "/admin", label: "Admin", icon: UsersRound, adminOnly: true },
  { href: "/preview", label: "Chart Preview", icon: LayoutDashboard },
];

function NavItemLabel({ label }: { label: string }) {
  const { pending } = useLinkStatus();

  return (
    <span
      className={cn(
        "transition-opacity duration-200",
        pending && "opacity-60",
      )}
    >
      {label}
      {pending ? (
        <span className="ml-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500 align-middle" />
      ) : null}
    </span>
  );
}

export function SidebarNav({
  isAdmin,
  onNavigate,
}: {
  isAdmin: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1 px-4 py-6">
      {NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-bold transition backdrop-blur-xl",
              active
                ? "border border-white/80 bg-white/55 text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_30px_rgba(32,201,151,0.12)] ring-1 ring-emerald-100/70"
                : "text-slate-600 hover:bg-white/45 hover:text-slate-950 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <NavItemLabel label={item.label} />
          </Link>
        );
      })}
    </nav>
  );
}
