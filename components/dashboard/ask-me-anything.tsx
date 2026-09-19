"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type TrackedReport = {
  id: string;
  title: string;
  question: string;
  schedule: string;
  last_run_at: string | null;
  last_result: unknown;
};

function messageText(message: UIMessage): string {
  if (!message.parts?.length) return "";
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => ("text" in part ? String(part.text) : ""))
    .join("");
}

function LiveReportPanel({
  messages,
}: {
  messages: UIMessage[];
}) {
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  if (!lastAssistant) return null;

  const toolParts = (lastAssistant.parts ?? []).filter((part) =>
    String(part.type).startsWith("tool-"),
  );

  if (toolParts.length === 0) return null;

  return (
    <div className="mt-4 rounded-xl border border-emerald-200/70 bg-emerald-50/60 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-800">
        Live report data
      </p>
      <div className="max-h-64 space-y-2 overflow-y-auto text-xs text-slate-700">
        {toolParts.map((part, index) => {
          const output =
            "output" in part
              ? part.output
              : "result" in part
                ? (part as { result?: unknown }).result
                : null;
          if (output == null) return null;
          return (
            <pre
              key={`${part.type}-${index}`}
              className="overflow-x-auto rounded-lg bg-white/80 p-2 font-mono"
            >
              {JSON.stringify(output, null, 2)}
            </pre>
          );
        })}
      </div>
    </div>
  );
}

export function AskMeAnythingPanel() {
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/ama/chat" }),
    [],
  );
  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport,
  });
  const [input, setInput] = useState("");
  const [tracked, setTracked] = useState<TrackedReport[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const busy = status === "submitted" || status === "streaming";

  async function loadTracked() {
    try {
      const response = await fetch("/api/ama/tracked");
      if (!response.ok) return;
      const body = (await response.json()) as { reports?: TrackedReport[] };
      setTracked(body.reports ?? []);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    void loadTracked();
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    await sendMessage({ text });
  }

  async function saveCurrentQuestion() {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const question = lastUser ? messageText(lastUser) : input.trim();
    if (!question) {
      setSaveError("Ask a question first, then save it as a tracked report.");
      return;
    }
    setSaveError(null);
    try {
      const response = await fetch("/api/ama/tracked", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: question.slice(0, 80),
          question,
          schedule: "daily",
        }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Save failed");
      await loadTracked();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function refreshReport(id: string) {
    await fetch(`/api/ama/tracked/${id}`, { method: "POST" });
    await loadTracked();
  }

  async function deleteReport(id: string) {
    await fetch(`/api/ama/tracked/${id}`, { method: "DELETE" });
    await loadTracked();
  }

  return (
    <section className="liquid-glass mb-6 rounded-[1.25rem] border border-white/60 bg-white/70 p-5 shadow-[0_12px_40px_rgba(31,42,61,0.06)] backdrop-blur-xl">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-dark">Ask Me Anything</h2>
          <p className="mt-1 text-sm text-slate-600">
            Natural-language questions over Zoho pipelines and live tracker
            snapshots. Restricted to leadership.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => void saveCurrentQuestion()}
          >
            Save as tracked report
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy || messages.length === 0}
            onClick={() => setMessages([])}
          >
            Clear chat
          </Button>
        </div>
      </div>

      {tracked.length > 0 && (
        <div className="mb-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Tracked reports
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {tracked.map((report) => (
              <div
                key={report.id}
                className="rounded-xl border border-slate-200 bg-white/90 p-3"
              >
                <p className="text-sm font-semibold text-dark">{report.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                  {report.question}
                </p>
                <p className="mt-2 text-[11px] text-slate-400">
                  {report.schedule}
                  {report.last_run_at
                    ? ` · last updated ${new Date(report.last_run_at).toLocaleString()}`
                    : " · not run yet"}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="text-xs font-semibold text-emerald-700 underline"
                    onClick={() => void refreshReport(report.id)}
                  >
                    Refresh
                  </button>
                  <button
                    type="button"
                    className="text-xs font-semibold text-red-600 underline"
                    onClick={() => void deleteReport(report.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4 max-h-72 space-y-3 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/70 p-3">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-500">
            Try: “How is Standard pipeline lead-to-registration this week vs
            last?” or “Summarise visa lodgements and refusals.”
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={
                message.role === "user"
                  ? "ml-8 rounded-2xl bg-dark px-3 py-2 text-sm text-white"
                  : "mr-8 rounded-2xl bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
              }
            >
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-70">
                {message.role === "user" ? "You" : "Mission Control"}
              </p>
              <div className="whitespace-pre-wrap">{messageText(message)}</div>
            </div>
          ))
        )}
        {busy && (
          <p className="text-xs font-medium text-slate-500">Thinking…</p>
        )}
      </div>

      <LiveReportPanel messages={messages} />

      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about sales, enrolment, visa, centres…"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-emerald-500/30 focus:ring-2"
          disabled={busy}
        />
        <Button type="submit" disabled={busy || !input.trim()}>
          Ask
        </Button>
      </form>

      {(error || saveError) && (
        <p className="mt-2 text-sm font-medium text-red-700">
          {error?.message ?? saveError}
        </p>
      )}
    </section>
  );
}
