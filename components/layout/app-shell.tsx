import Image from "next/image";
import Link from "next/link";
import { getSessionUser, isDemoMode } from "@/lib/auth";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";

export async function Sidebar() {
  const user = await getSessionUser();
  const isAdmin = user?.role === "admin";

  return (
    <aside className="hidden w-72 shrink-0 border-r border-white/70 bg-white/55 shadow-[12px_0_55px_rgba(31,42,61,0.06)] backdrop-blur-2xl lg:flex lg:flex-col">
      <div className="flex h-20 items-center gap-3 border-b border-white/70 px-7">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image
            src="/ferguson-logo.png"
            alt="Ferguson Education & Migration"
            width={44}
            height={44}
            className="h-11 w-auto object-contain"
          />
          <div>
            <p className="font-black tracking-tight text-slate-950">Ferguson SOT</p>
            <p className="text-sm font-semibold text-slate-500">Mission Control</p>
          </div>
        </Link>
      </div>
      <SidebarNav isAdmin={isAdmin} />
    </aside>
  );
}

export async function TopBar() {
  const user = await getSessionUser();
  const demoMode = isDemoMode();

  return (
    <header className="sticky top-0 z-20 border-b border-white/70 bg-white/55 shadow-[0_12px_40px_rgba(31,42,61,0.05)] backdrop-blur-2xl">
      <div className="flex min-h-20 flex-col justify-center gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="lg:hidden">
          <Image
            src="/ferguson-logo.png"
            alt="Ferguson"
            width={40}
            height={40}
            className="h-8 w-auto object-contain"
          />
        </div>
        <div className="hidden lg:block">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-600">
            Ferguson Insight
          </p>
          <h1 className="mt-1 text-lg font-black tracking-tight text-slate-900 sm:text-xl">
            Education & Migration — Single Source of Truth
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <>
              <span className="hidden text-sm font-bold text-slate-600 sm:inline">
                {user.name}
              </span>
              {user.role === "admin" && (
                <span className="rounded-full border border-white/80 bg-white/50 px-3 py-1 text-sm font-black text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-xl ring-1 ring-emerald-100/70">
                  Admin
                </span>
              )}
            </>
          )}
          <UserMenu demoMode={demoMode} userName={user?.name} />
        </div>
      </div>
    </header>
  );
}

export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
        {title}
      </h1>
      {description && (
        <p className="mt-2 text-base font-medium leading-7 text-slate-600">
          {description}
        </p>
      )}
    </div>
  );
}
