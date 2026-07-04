"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ZohoSalesSyncButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSync() {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/sync/zoho/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const body = (await response.json()) as {
        error?: string;
        rowCount?: number;
        leadsFetched?: number;
        dealsFetched?: number;
        stageHistoriesFetched?: number;
      };

      if (!response.ok) {
        throw new Error(body.error ?? "Sync failed");
      }

      setMessage(
        `Synced ${body.rowCount ?? 0} weekly rows from Zoho (${body.leadsFetched ?? 0} leads, ${body.dealsFetched ?? 0} deals).`,
      );
    } catch (syncError) {
      setError(
        syncError instanceof Error ? syncError.message : "Sync failed",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="secondary"
        disabled={loading}
        onClick={handleSync}
      >
        {loading ? "Syncing from Zoho…" : "Sync Sales from Zoho"}
      </Button>
      {message ? (
        <p className="text-sm font-medium text-emerald-700">{message}</p>
      ) : null}
      {error ? (
        <p className="text-sm font-medium text-red-700">{error}</p>
      ) : null}
    </div>
  );
}
