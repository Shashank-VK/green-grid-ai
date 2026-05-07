"use client";

import { useEffect, useState } from "react";

import { useGridStore } from "@/store/gridStore";

const STEPS = [
  "Geocoding location...",
  "Generating grid overlay...",
  "Analyzing satellite imagery...",
  "Querying charging infrastructure...",
  "Calculating viability scores...",
  "Detecting top clusters...",
];

export function LoadingOverlay() {
  const analysisStatus = useGridStore((state) => state.analysisStatus);
  const analysisTarget = useGridStore((state) => state.analysisTarget);
  const cancelAnalysis = useGridStore((state) => state.cancelAnalysis);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (analysisStatus !== "running") {
      setStepIndex(0);
      return;
    }
    const id = window.setInterval(() => {
      setStepIndex((value) => Math.min(STEPS.length - 1, value + 1));
    }, 1400);
    return () => window.clearInterval(id);
  }, [analysisStatus]);

  if (analysisStatus !== "running") {
    return null;
  }

  const locationName = analysisTarget ?? "location";
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-md">
      <div className="w-[min(92vw,28rem)] rounded-2xl border border-[var(--border-subtle)] bg-white/95 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.12)]">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[rgba(217,119,87,0.22)] border-t-[var(--brand-primary)]" />
        <h2 className="mt-5 text-center font-display text-[22px] font-bold tracking-[-0.01em] text-[var(--text-primary)]">Analyzing {locationName}...</h2>
        <p className="mt-2 text-center text-sm text-[var(--text-secondary)]">
          Step {stepIndex + 1}/{STEPS.length}: {STEPS[stepIndex]}
        </p>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
          <div className="h-full rounded-full bg-[var(--brand-primary)] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <button
          type="button"
          onClick={cancelAnalysis}
          className="mt-5 w-full rounded-full border border-[var(--border-subtle)] px-3 py-2 font-body text-[13px] text-[var(--text-secondary)] transition duration-150 hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
