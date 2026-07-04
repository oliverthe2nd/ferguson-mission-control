"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { SidebarNav, type NavPermissions } from "./sidebar-nav";

export function MobileNav({ permissions }: { permissions: NavPermissions }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const drawer =
    open && mounted ? (
      <div className="fixed inset-0 z-[100] lg:hidden" role="presentation">
        <button
          type="button"
          className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
          aria-label="Close navigation menu"
          onClick={() => setOpen(false)}
        />

        <aside
          id="mobile-nav-drawer"
          className="absolute inset-y-0 left-0 z-10 flex w-[min(100vw,20rem)] flex-col border-r border-slate-200 bg-white shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div className="flex h-20 shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-5">
            <Link
              href="/dashboard"
              className="flex min-w-0 items-center gap-3"
              onClick={() => setOpen(false)}
            >
              <Image
                src="/ferguson-logo.png"
                alt="Ferguson Education & Migration"
                width={40}
                height={40}
                className="h-10 w-auto shrink-0 object-contain"
              />
              <div className="min-w-0">
                <p className="truncate font-black tracking-tight text-slate-950">
                  Ferguson SOT
                </p>
                <p className="truncate text-sm font-semibold text-slate-500">
                  Mission Control
                </p>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700"
              aria-label="Close navigation menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <SidebarNav permissions={permissions} onNavigate={() => setOpen(false)} />
          </div>
        </aside>
      </div>
    ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/80 bg-white/55 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl ring-1 ring-slate-200/60 lg:hidden"
        aria-label="Open navigation menu"
        aria-expanded={open}
        aria-controls="mobile-nav-drawer"
      >
        <Menu className="h-5 w-5" />
      </button>

      {drawer ? createPortal(drawer, document.body) : null}
    </>
  );
}
