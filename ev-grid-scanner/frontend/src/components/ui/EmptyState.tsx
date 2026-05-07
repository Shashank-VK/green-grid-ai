"use client";

import { useGridStore } from "@/store/gridStore";

const TRIES = ["Yelahanka", "Electronic City", "Koramangala"];

export function EmptyState() {
  const analysisResult = useGridStore((state) => state.analysisResult);
  const runAnalysis = useGridStore((state) => state.runAnalysis);

  if (analysisResult) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
      <div className="pointer-events-auto w-[min(92vw,420px)] rounded-2xl border border-[var(--border-subtle)] bg-white/95 p-8 text-center shadow-[0_4px_24px_rgba(0,0,0,0.12)] backdrop-blur-xl">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-glow)] font-display text-2xl font-extrabold text-[var(--brand-primary)]">
          EV
        </div>
        <h1 className="font-display text-[22px] font-bold tracking-[-0.01em] text-[var(--text-primary)]">
          Where should Bangalore charge?
        </h1>
        <p className="mt-3 font-body text-[13px] leading-6 text-[var(--text-secondary)]">
          Search any locality to get a viability score, cost estimate, and charger recommendation in under 60 seconds.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {TRIES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => void runAnalysis({ location: item, analysis_mode: "deep" })}
              className="rounded-full border border-[var(--border-subtle)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-secondary)] transition duration-150 hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
            >
              Try: {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
