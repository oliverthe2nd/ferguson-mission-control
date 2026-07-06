"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { isStudentAtRisk } from "@/lib/alerts";
import { formatOptionalDate } from "@/lib/format";
import type { EnrolmentMilestoneRow } from "@/lib/validators/enrolment-milestones";

type Filter = "all" | "at_risk" | "on_track";

export function EnrolmentStudentTable({ rows }: { rows: EnrolmentMilestoneRow[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    const list = [...rows].sort((a, b) => {
      const aRisk = isStudentAtRisk(a) ? 0 : 1;
      const bRisk = isStudentAtRisk(b) ? 0 : 1;
      if (aRisk !== bRisk) return aRisk - bRisk;
      return a.student_name.localeCompare(b.student_name);
    });
    if (filter === "at_risk") return list.filter((row) => isStudentAtRisk(row));
    if (filter === "on_track") return list.filter((row) => !isStudentAtRisk(row));
    return list;
  }, [rows, filter]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {(
          [
            ["all", "All students"],
            ["at_risk", "AT RISK only"],
            ["on_track", "On track only"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
              filter === value
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-white/70 text-slate-600">
            <tr>
              <th className="px-3 py-2 font-bold">Student</th>
              <th className="px-3 py-2 font-bold">ID</th>
              <th className="px-3 py-2 font-bold">Registered</th>
              <th className="px-3 py-2 font-bold">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.student_id} className="border-b border-white/50">
                <td className="px-3 py-2 font-medium">{row.student_name}</td>
                <td className="px-3 py-2 font-mono text-xs text-slate-500">{row.student_id}</td>
                <td className="px-3 py-2">{formatOptionalDate(row.registration_date) ?? "—"}</td>
                <td className="px-3 py-2">
                  {isStudentAtRisk(row) ? (
                    <Badge status="red">AT RISK</Badge>
                  ) : (
                    <Badge status="green">On Track</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
