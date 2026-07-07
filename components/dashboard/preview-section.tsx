"use client";

import type { ReactNode } from "react";
import { useCallback, useRef } from "react";
import { PdfExportButton } from "./pdf-export-button";

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const reportRef = useRef<HTMLElement>(null);
  const getExportTarget = useCallback(() => reportRef.current, []);

  return (
    <section ref={reportRef} className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
          {title}
        </h2>
        <PdfExportButton getTarget={getExportTarget} title={title} className="shrink-0" />
      </div>
      {children}
    </section>
  );
}
