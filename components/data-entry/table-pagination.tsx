"use client";

import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const DATA_ENTRY_PAGE_SIZE = 50;

type TablePaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

export function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: TablePaginationProps) {
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-4 text-center text-sm font-medium text-slate-600">
        Showing {start}–{end} of {totalItems} rows
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <PaginationButton
          label="Previous"
          icon={<ChevronLeft className="h-5 w-5" />}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        />
        <span className="min-w-[8rem] text-center text-base font-bold text-slate-800">
          Page {currentPage} of {totalPages}
        </span>
        <PaginationButton
          label="Next"
          icon={<ChevronRight className="h-5 w-5" />}
          iconAfter
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        />
      </div>
    </div>
  );
}

function PaginationButton({
  label,
  icon,
  iconAfter,
  onClick,
  disabled,
}: {
  label: string;
  icon: ReactNode;
  iconAfter?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex min-h-[3rem] min-w-[9rem] items-center justify-center gap-2 rounded-xl border px-6 text-base font-bold transition",
        disabled
          ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
          : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-300 hover:bg-emerald-100 active:scale-[0.98]",
      )}
    >
      {!iconAfter && icon}
      {label}
      {iconAfter && icon}
    </button>
  );
}
