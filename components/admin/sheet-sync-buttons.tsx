"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function SheetSyncButtons({
  googleConfigured,
  graphConfigured,
}: {
  googleConfigured: boolean;
  graphConfigured: boolean;
}) {
  const [loading, setLoading] = useState<"visa" | "enrolment" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runSync(kind: "visa" | "enrolment") {
    setLoading(kind);
    setMessage(null);
    setError(null);
    try {
      const path =
        kind === "visa"
          ? "/api/sync/sheets/visa"
          : "/api/sync/sheets/enrolment";
      const response = await fetch(path, { method: "POST" });
      const body = (await response.json()) as {
        error?: string;
        rowCount?: number;
        sheetTitle?: string;
      };
      if (!response.ok) throw new Error(body.error ?? "Sync failed");
      setMessage(
        kind === "visa"
          ? `Synced ${body.rowCount ?? 0} visa rows from Google Sheet${
              body.sheetTitle ? ` (${body.sheetTitle})` : ""
            }.`
          : `Synced ${body.rowCount ?? 0} enrolment rows from SharePoint.`,
      );
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "Sync failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={!googleConfigured || loading !== null}
          onClick={() => runSync("visa")}
        >
          {loading === "visa" ? "Syncing visa…" : "Sync Visa from Google Sheets"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={!graphConfigured || loading !== null}
          onClick={() => runSync("enrolment")}
        >
          {loading === "enrolment"
            ? "Syncing enrolment…"
            : "Sync Enrolment from SharePoint"}
        </Button>
      </div>
      {!googleConfigured && (
        <p className="text-xs text-slate-500">
          Visa sync needs GOOGLE_SERVICE_ACCOUNT_JSON (share the sheet with the
          service account email).
        </p>
      )}
      {!graphConfigured && (
        <p className="text-xs text-slate-500">
          Enrolment sync needs MS_GRAPH_TENANT_ID, CLIENT_ID, CLIENT_SECRET, and
          MS_GRAPH_SHARE_URL (or site/drive item ids).
        </p>
      )}
      {message ? (
        <p className="text-sm font-medium text-emerald-700">{message}</p>
      ) : null}
      {error ? (
        <p className="text-sm font-medium text-red-700">{error}</p>
      ) : null}
    </div>
  );
}
