"use client";

import type { ReactNode } from "react";
import { useCallback, useRef } from "react";
import { PdfExportButton } from "./pdf-export-button";

type DashboardReportSectionProps = {
  title: string;
  description?: string;
  lastUploadLabel?: string | null;
  children: ReactNode;
};

export function DashboardReportSection({
  title,
  description,
  lastUploadLabel,
  children,
}: DashboardReportSectionProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const getExportTarget = useCallback(() => reportRef.current, []);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-base font-medium leading-7 text-slate-600">
              {description}
            </p>
          )}
          {lastUploadLabel && (
            <p className="mt-2 text-sm font-medium text-slate-500">
              Last upload: {lastUploadLabel}
            </p>
          )}
        </div>
        <PdfExportButton
          getTarget={getExportTarget}
          title={title}
          className="shrink-0"
        />
      </div>
      <div ref={reportRef} className="space-y-6">
        {children}
      </div>
    </div>
  );
}
