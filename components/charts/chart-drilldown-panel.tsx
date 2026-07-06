"use client";

import { X } from "lucide-react";
import type { DrillDownRecord } from "@/lib/framework/types";

type ChartDrilldownPanelProps = {
  title: string;
  subtitle?: string;
  records: DrillDownRecord[];
  onClose: () => void;
};

export function ChartDrilldownPanel({
  title,
  subtitle,
  records,
  onClose,
}: ChartDrilldownPanelProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-4 sm:items-center">
      <div className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {records.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No records for this selection.</p>
          ) : (
            <ul className="space-y-3">
              {records.map((record) => (
                <li
                  key={record.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <p className="font-semibold text-slate-900">{record.label}</p>
                  {record.sublabel && (
                    <p className="text-sm text-slate-600">{record.sublabel}</p>
                  )}
                  {record.detail && (
                    <p className="text-xs text-slate-500">{record.detail}</p>
                  )}
                  {record.meta && (
                    <dl className="mt-2 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
                      {Object.entries(record.meta).map(([key, value]) => (
                        <div key={key}>
                          <span className="font-medium capitalize">{key.replace(/_/g, " ")}: </span>
                          {String(value)}
                        </div>
                      ))}
                    </dl>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
