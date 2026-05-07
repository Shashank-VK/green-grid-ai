"use client";

import { Download } from "lucide-react";
import { useEffect, useState } from "react";

import { getScoreBackground, getScoreColor, scoreToVerdict } from "@/lib/scoreUtils";
import { useGridStore } from "@/store/gridStore";

const FACTORS = [
  ["Demand", "25%", "s1_demand"],
  ["Infra Gap", "15%", "s2_infra_gap"],
  ["Grid Ready", "20%", "s3_grid_ready"],
  ["Commercial", "15%", "s4_commercial"],
  ["Strategic", "15%", "s5_strategic"],
  ["Env Risk", "-10%", "s6_env_risk"],
] as const;

export function IntelligencePanel() {
  const analysisResult = useGridStore((state) => state.analysisResult);
  const currentRtoZone = useGridStore((state) => state.currentRtoZone);
  const generatePdf = useGridStore((state) => state.generatePdf);
  const selectedCellId = useGridStore((state) => state.selectedCellId);

  if (!analysisResult || !currentRtoZone) {
    return (
      <aside className="absolute right-0 top-0 z-30 hidden h-full w-[320px] border-l border-[var(--border-subtle)] bg-white md:block">
        <div className="flex h-full items-center justify-center px-6 text-center">
          <div>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-subtle)] text-xl text-[var(--brand-primary)]">
              ⚡
            </div>
            <p className="font-display text-[16px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
              No Analysis Yet
            </p>
            <p className="mt-2 font-body text-[13px] leading-6 text-[var(--text-secondary)]">
              Search a Bangalore locality above to begin.
            </p>
          </div>
        </div>
      </aside>
    );
  }

  const bestCluster = analysisResult.top_clusters?.[0];
  const selectedCell =
    analysisResult.cells.find((cell) => cell.id === selectedCellId) ??
    analysisResult.cells.find((cell) => cell.id === bestCluster?.best_cell_id) ??
    analysisResult.cells[0];
  const score = selectedCell?.final_score ?? bestCluster?.avg_score ?? 0;
  const color = getScoreColor(score);
  const verdict = selectedCell?.verdict ?? scoreToVerdict(score);
  const scoreBg = getScoreBackground(score);
  const insight = buildInsight(analysisResult.location.name, verdict, selectedCell?.charger_recommendation?.label);

  return (
    <aside className="absolute right-0 top-0 z-30 hidden h-full w-[320px] overflow-hidden border-l border-[var(--border-subtle)] bg-white md:block">
      <div className="max-h-full overflow-y-auto pb-[64px]">
        <section className="flex h-20 items-center justify-between border-b border-[var(--border-subtle)] px-4">
          <div>
            <h2 className="font-display text-[20px] font-bold tracking-[-0.01em]">{currentRtoZone.office_name}</h2>
            <span className="mt-1 inline-flex rounded-full border border-[var(--brand-primary)] px-2 py-0.5 font-mono text-[11px] text-[var(--brand-primary)]">
              {currentRtoZone.code}
            </span>
          </div>
          <div className="text-right">
            <p className="font-display text-[15px] font-semibold text-[var(--brand-primary)]">
              {currentRtoZone.total_evs.toLocaleString("en-IN")} EVs
            </p>
            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Registered EVs</p>
          </div>
        </section>

        <section className="relative border-b border-[var(--border-subtle)] px-4 py-5" style={{ backgroundColor: scoreBg }}>
          <div className="absolute bottom-0 right-0 top-0 w-[3px]" style={{ backgroundColor: color }} />
          <AnimatedScore score={score} color={color} />
          <div className="mt-1 font-mono text-[12px] uppercase tracking-[0.12em]" style={{ color }}>
            {verdict}
          </div>
          <p className="mt-3 max-w-[25ch] font-body text-[12px] leading-5 text-[var(--text-secondary)]">{insight}</p>
        </section>

        <section className="space-y-3 border-b border-[var(--border-subtle)] px-4 py-4 pb-20">
          {FACTORS.map(([name, weight, key], index) => {
            const value = selectedCell?.scores?.[key] ?? 0;
            const factorColor = getScoreColor(key === "s6_env_risk" ? 10 - value : value);
            return (
              <div key={key} className="grid h-11 grid-cols-[88px_1fr_34px] items-center gap-3">
                <div>
                  <p className="font-body text-[12px] text-[var(--text-primary)]">{name}</p>
                  <p className="font-mono text-[10px] text-[var(--text-tertiary)]">({weight})</p>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
                  <div
                    className="h-full rounded-full transition-[width] duration-[600ms]"
                    style={{ width: `${value * 10}%`, backgroundColor: factorColor, transitionDelay: `${index * 80}ms` }}
                  />
                </div>
                <div className="font-display text-[12px] font-semibold" style={{ color: factorColor }}>
                  {value.toFixed(1)}
                </div>
              </div>
            );
          })}
        </section>
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-white/95 p-3 backdrop-blur">
        <button
          type="button"
          onClick={() => void generatePdf()}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand-primary)] font-display text-[13px] font-semibold text-[#FAF9F6] transition duration-150 hover:bg-[var(--brand-hover)] active:scale-[0.98]"
        >
          <Download className="h-4 w-4" /> Download Full Report
        </button>
      </div>
    </aside>
  );
}

function AnimatedScore({ score, color }: { score: number; color: string }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const started = performance.now();
    let frame = 0;
    function tick(now: number) {
      const progress = Math.min(1, (now - started) / 400);
      setValue(score * progress);
      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    }
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [score]);

  return (
    <div className="font-display text-[52px] font-extrabold leading-none tracking-[-0.02em]" style={{ color }}>
      {value.toFixed(1)}
    </div>
  );
}

function buildInsight(location: string, verdict: string, charger?: string): string {
  return `${location} is ${verdict.toLowerCase()} with ${charger ?? "a charger"} recommended from current grid and demand signals.`;
}
