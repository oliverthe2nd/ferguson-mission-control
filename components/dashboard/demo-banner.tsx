export function DemoBanner() {
  return (
    <div className="liquid-glass mb-6 overflow-hidden rounded-[1.25rem] border border-emerald-200/60 bg-white/55 px-4 py-3 text-sm text-dark shadow-[0_12px_40px_rgba(32,201,151,0.08)] backdrop-blur-xl">
      <strong>Demo mode</strong> — Clerk is not configured, so auth is bypassed
      and you are signed in as a demo admin. Add{" "}
      <code className="rounded bg-white/80 px-1 font-mono text-xs">
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
      </code>{" "}
      and{" "}
      <code className="rounded bg-white/80 px-1 font-mono text-xs">
        CLERK_SECRET_KEY
      </code>{" "}
      to <code className="font-mono text-xs">.env.local</code> to enable real
      sign-in.{" "}
      <a href="/preview" className="font-bold text-emerald-700 underline">
        View chart preview →
      </a>
    </div>
  );
}
