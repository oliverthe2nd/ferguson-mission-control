import Link from "next/link";
import type { AlertItem } from "@/lib/alerts";

interface AlertTrayProps {
  alerts: AlertItem[];
}

export function AlertTray({ alerts }: AlertTrayProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="liquid-glass mb-6 overflow-hidden rounded-[1.25rem] border border-red-200/70 bg-red-50/80 p-4 shadow-[0_12px_40px_rgba(228,90,42,0.08)] backdrop-blur-xl">
      <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-red-700">
        AT RISK — Requires Attention
      </h2>
      <ul className="space-y-2">
        {alerts.map((alert) => (
          <li key={alert.id} className="flex items-start gap-2 text-sm">
            <span
              className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                alert.severity === "red" ? "bg-red-500" : "bg-amber-500"
              }`}
            />
            <div>
              <span className="font-bold text-dark">{alert.pillar}:</span>{" "}
              <span className="text-slate-700">{alert.message}</span>
              {alert.href && (
                <Link
                  href={alert.href}
                  className="ml-2 font-bold text-emerald-700 hover:underline"
                >
                  View →
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
