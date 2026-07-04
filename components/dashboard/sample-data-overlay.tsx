import type { ReactNode } from "react";

export function SampleDataOverlay({
  children,
  hint,
}: {
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="relative min-h-[10rem]">
      {children}
      <div
        aria-live="polite"
        role="status"
        className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
      >
        <div className="absolute inset-0 bg-red-500/[0.04]" />
        <div className="absolute left-1/2 top-4 z-30 -translate-x-1/2">
          <div className="rounded-lg border-2 border-red-700 bg-red-600 px-5 py-2 shadow-[0_8px_30px_rgba(220,38,38,0.4)]">
            <p className="text-center text-xs font-black uppercase tracking-[0.35em] text-white sm:text-sm">
              SAMPLE ONLY
            </p>
          </div>
          {hint ? (
            <p className="pointer-events-auto mt-2 max-w-md text-center text-xs font-semibold text-red-700">
              {hint}
            </p>
          ) : null}
        </div>
        <div
          aria-hidden
          className="absolute inset-0 flex items-center justify-center pt-16"
        >
          <p className="-rotate-12 select-none text-center text-[clamp(2.75rem,14vw,7.5rem)] font-black uppercase leading-none tracking-[0.08em] text-red-600/[0.14]">
            SAMPLE ONLY
          </p>
        </div>
      </div>
    </div>
  );
}

export function SampleDataBoundary({
  active,
  children,
  hint,
}: {
  active: boolean;
  children: ReactNode;
  hint?: ReactNode;
}) {
  if (!active) return <>{children}</>;
  return <SampleDataOverlay hint={hint}>{children}</SampleDataOverlay>;
}
