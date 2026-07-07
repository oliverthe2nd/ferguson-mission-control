"use client";

import { useState } from "react";
import { exportElementToPdf } from "@/lib/export-pdf";
import { cn } from "@/lib/utils";

function PdfIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7l-5-5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M14 2v5h5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <text
        x="12"
        y="16.5"
        textAnchor="middle"
        fontSize="5.5"
        fontWeight="700"
        fill="currentColor"
        fontFamily="system-ui, sans-serif"
      >
        PDF
      </text>
    </svg>
  );
}

type PdfExportButtonProps = {
  getTarget: () => HTMLElement | null;
  title: string;
  className?: string;
};

export function PdfExportButton({ getTarget, title, className }: PdfExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    const target = getTarget();
    if (!target || exporting) return;
    setExporting(true);
    try {
      await exportElementToPdf(target, title);
    } catch (error) {
      console.error("PDF export failed:", error);
      window.alert("Could not export PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleExport()}
      disabled={exporting}
      title="Export PDF"
      aria-label={`Export ${title} as PDF`}
      className={cn(
        "rounded-full border border-white/80 bg-white/50 p-2 text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_8px_20px_rgba(31,42,61,0.08)] backdrop-blur-xl ring-1 ring-slate-200/60 transition hover:border-red-200/80 hover:bg-white/80 hover:text-red-600 disabled:cursor-wait disabled:opacity-60",
        className,
      )}
    >
      <PdfIcon className="h-4 w-4" />
    </button>
  );
}
