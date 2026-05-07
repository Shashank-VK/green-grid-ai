"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { GridCell } from "@/lib/gridMath";
import { getScoreColor, scoreToVerdict } from "@/lib/scoreUtils";
import { useGridStore } from "@/store/gridStore";

const FACTOR_ROWS = [
  { key: "s1_demand", label: "Demand Density", help: "Measures EV demand concentration per grid cell." },
  { key: "s2_infra_gap", label: "Infrastructure Gap", help: "Captures charger undersupply relative to demand." },
  { key: "s3_grid_ready", label: "Grid Readiness", help: "Represents transformer proximity and power readiness." },
  { key: "s4_commercial", label: "Commercial Viability", help: "Highlights destination and dwell-time potential." },
  { key: "s5_strategic", label: "Physical Access", help: "Road quality and arterial connectivity." },
  { key: "s6_env_risk", label: "Environmental Risk", help: "Flood and tree constraints affecting deployment." },
] as const;

function formatInr(value: number): string {
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

function formatTimeline(totalWeeks?: string): string {
  return totalWeeks ? `${totalWeeks} weeks` : "N/A";
}

function toChartData(
  growthProjection?: {
    current_evs: number;
    projected: Record<string, number>;
  }
) {
  if (!growthProjection) {
    return [];
  }

  return [
    { year: "Now", evs: growthProjection.current_evs },
    ...Object.entries(growthProjection.projected).map(([year, evs]) => ({ year, evs })),
  ];
}

function sectionHeader(meta: string, title: string) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="mt-0.5 h-10 w-[3px] rounded bg-[var(--brand-primary)]" />
      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">{meta}</p>
        <h3 className="font-display text-[16px] font-bold tracking-[-0.01em] text-[var(--text-primary)]">{title}</h3>
      </div>
    </div>
  );
}

export function ReportView() {
  const analysisResult = useGridStore((state) => state.analysisResult);
  const generatePdf = useGridStore((state) => state.generatePdf);

  if (!analysisResult) {
    return (
      <section className="h-full overflow-y-auto bg-[var(--bg-page)] px-10 py-12">
        <div className="mx-auto max-w-4xl rounded-xl border border-[var(--border-subtle)] bg-white p-10 text-center shadow-[var(--shadow-card)]">
          <h2 className="font-display text-[24px] font-bold tracking-[-0.01em] text-[var(--text-primary)]">
            Intelligence Report
          </h2>
          <p className="mt-3 font-body text-[13px] text-[var(--text-secondary)]">
            Run a map analysis first. The full intelligence report appears here automatically.
          </p>
        </div>
      </section>
    );
  }

  const zone = analysisResult.rto_zone;
  const bestCluster = analysisResult.top_clusters?.[0] ?? analysisResult.clusters?.[0];
  const bestCell: GridCell | undefined =
    analysisResult.cells.find((cell) => cell.id === bestCluster?.best_cell_id) ??
    [...analysisResult.cells].sort((a, b) => (b.final_score ?? 0) - (a.final_score ?? 0))[0];

  const bestScore = bestCell?.final_score ?? bestCluster?.avg_score ?? 0;
  const verdict = bestCell?.verdict ?? scoreToVerdict(bestScore);
  const verdictColor = getScoreColor(bestScore);
  const factorSource = bestCell?.scores;
  const cost = bestCell?.cost_estimate ?? bestCluster?.cost_estimate;
  const timeline = bestCell?.timeline ?? bestCluster?.timeline;
  const growthData = toChartData(analysisResult.growth_projection);

  return (
    <section className="h-full overflow-y-auto bg-[var(--bg-page)]">
      <div className="mx-auto max-w-[1000px] px-10 py-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Intelligence Report</p>
        <h1 className="mt-2 font-display text-[28px] font-bold tracking-[-0.01em] text-[var(--text-primary)]">
          {analysisResult.location.name} EV Infrastructure Analysis
        </h1>
        <p className="mt-1 font-body text-[13px] text-[var(--text-secondary)]">
          Based on {analysisResult.cells.length} grid cells · {zone.code} · {new Date().toLocaleDateString()}
        </p>
        <div className="mt-5 border-t border-[var(--brand-border)]" />
      </div>

      <div className="border-y border-[var(--border-subtle)] bg-[var(--bg-card-inner)] px-10 py-5">
        <div className="mx-auto grid max-w-[1000px] grid-cols-2 gap-4 lg:grid-cols-6">
          <KpiCard label="Best Cell Score" value={bestScore.toFixed(1)} color={verdictColor} />
          <KpiCard label="Top Cluster Score" value={(bestCluster?.avg_score ?? 0).toFixed(1)} color={verdictColor} />
          <KpiCard label="Recommended Charger" value={bestCell?.charger_recommendation?.label ?? "N/A"} />
          <KpiCard
            label="Estimated Cost"
            value={cost ? `${formatInr(cost.total_min)} – ${formatInr(cost.total_max)}` : "N/A"}
          />
          <KpiCard label="BESCOM Timeline" value={formatTimeline(timeline?.total_weeks)} />
          <KpiCard label="EVs In Zone" value={zone.total_evs.toLocaleString("en-IN")} />
        </div>
      </div>

      <div className="mx-auto grid max-w-[1000px] gap-8 px-10 py-8 lg:grid-cols-[640px_280px]">
        <div className="space-y-8">
          <section className="rounded-xl border border-[var(--border-subtle)] bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="flex gap-3">
              <span className="h-full w-1 rounded bg-[var(--brand-primary)]" />
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--brand-primary)]">
                  Executive Summary
                </p>
                <p className="mt-2 font-body text-[13px] leading-7 text-[var(--text-secondary)]">
                  {analysisResult.location.name} is currently marked as {verdict.toLowerCase()} based on demand,
                  access, and infrastructure gap. Best performing zone is cell {bestCell?.id ?? "N/A"} with a
                  score of {bestScore.toFixed(1)}.
                </p>
              </div>
            </div>
          </section>

          <section>
            {sectionHeader("02 · Spatial Analysis", "Score Factor Analysis")}
            <div className="space-y-2">
              {FACTOR_ROWS.map((row, index) => {
                const value = factorSource?.[row.key] ?? 0;
                const color = getScoreColor(row.key === "s6_env_risk" ? 10 - value : value);
                return (
                  <article
                    key={row.key}
                    className="rounded-lg border border-[var(--border-subtle)] bg-white px-4 py-3 shadow-[var(--shadow-card)]"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-display text-[13px] font-semibold text-[var(--text-primary)]">{row.label}</h4>
                      <span
                        className="rounded-full border px-2 py-0.5 font-mono text-[11px]"
                        style={{ color, borderColor: color, backgroundColor: `${color}14` }}
                      >
                        {value.toFixed(1)}
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded bg-[var(--bg-card-inner)]">
                      <div
                        className="h-full rounded transition-[width] duration-[600ms]"
                        style={{
                          width: `${Math.max(0, Math.min(100, value * 10))}%`,
                          backgroundColor: color,
                          transitionDelay: `${index * 80}ms`,
                        }}
                      />
                    </div>
                    <p className="mt-2 font-body text-[11px] text-[var(--text-secondary)]">{row.help}</p>
                  </article>
                );
              })}
            </div>
          </section>

          <section>
            {sectionHeader("03 · Investment", "Investment Analysis")}
            <article className="rounded-xl border border-[var(--border-subtle)] bg-white p-6 shadow-[var(--shadow-card)]">
              <p className="font-display text-[32px] font-extrabold tracking-[-0.02em] text-[var(--brand-primary)]">
                {cost ? `${formatInr(cost.total_min)} – ${formatInr(cost.total_max)}` : "N/A"}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                Total Estimated Investment
              </p>
              <div className="my-4 border-t border-[var(--border-subtle)]" />
              <LineItem label="Equipment" value={cost ? `${formatInr(cost.hardware_min)} – ${formatInr(cost.hardware_max)}` : "N/A"} />
              <LineItem
                label="Installation"
                value={cost ? `${formatInr(cost.installation_min)} – ${formatInr(cost.installation_max)}` : "N/A"}
              />
              {cost?.transformer_adder ? (
                <div className="mt-3 rounded-lg border border-[rgba(212,147,58,0.35)] bg-[rgba(212,147,58,0.08)] px-3 py-2 font-body text-[11px] text-[var(--warning)]">
                  Transformer upgrade may be required — add {formatInr(cost.transformer_adder)}.
                </div>
              ) : null}
              <p className="mt-3 font-body text-[10px] text-[var(--text-tertiary)]">
                FAME-II subsidy eligibility: verify current tranche with BESCOM and official portals.
              </p>
            </article>
          </section>

          <section>
            {sectionHeader("04 · Approvals", "Approval & Implementation Timeline")}
            <article className="rounded-xl border border-[var(--border-subtle)] bg-white p-6 shadow-[var(--shadow-card)]">
              <TimelineRows
                phases={[
                  { label: "Feasibility", weeks: 2, color: "#B45309" },
                  { label: "BESCOM Load", weeks: timeline?.approval_weeks ?? 0, color: "#D97757" },
                  { label: "CEIG Approval", weeks: 4, color: "#A16207" },
                  { label: "Civil Works", weeks: timeline?.civil_weeks ?? 0, color: "#7C2D12" },
                  { label: "Commissioning", weeks: timeline?.commissioning_weeks ?? 0, color: "#92400E" },
                ]}
              />
              <div className="mt-3 rounded-lg border border-[rgba(212,147,58,0.35)] bg-[rgba(212,147,58,0.08)] px-3 py-2 font-body text-[11px] text-[var(--warning)]">
                BESCOM load sanction is usually the longest phase. Start this before hardware procurement.
              </div>
            </article>
          </section>

          <section>
            {sectionHeader("05 · Forecast", "EV Demand Forecast")}
            <article className="rounded-xl border border-[var(--border-subtle)] bg-white p-4 shadow-[var(--shadow-card)]">
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                    <defs>
                      <linearGradient id="coralGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D97757" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#D97757" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#F0EDE8" strokeDasharray="3 3" />
                    <XAxis dataKey="year" tick={{ fontFamily: "DM Mono", fontSize: 10, fill: "#9C8E84" }} />
                    <YAxis
                      tickFormatter={(value: number) => (value >= 1000 ? `${(value / 1000).toFixed(0)}k` : `${value}`)}
                      tick={{ fontFamily: "DM Mono", fontSize: 10, fill: "#9C8E84" }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#FFFFFF",
                        border: "1px solid rgba(0,0,0,0.07)",
                        borderRadius: 8,
                        fontFamily: "DM Mono",
                        fontSize: 11,
                      }}
                    />
                    <Area type="monotone" dataKey="evs" stroke="#D97757" strokeWidth={2} fill="url(#coralGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-3 font-body text-[12px] text-[var(--text-secondary)]">
                At current trajectory, this zone is projected to continue EV growth through 2028–2030.
              </p>
            </article>
          </section>
        </div>

        <aside className="sticky top-6 h-fit rounded-xl border border-[var(--border-subtle)] bg-white p-5 shadow-[var(--shadow-card)]">
          <span className="mb-3 block h-[3px] rounded" style={{ backgroundColor: verdictColor }} />
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Zone Verdict</p>
          <p className="font-display text-[40px] font-extrabold tracking-[-0.02em]" style={{ color: verdictColor }}>
            {bestScore.toFixed(1)}
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.12em]" style={{ color: verdictColor }}>
            {verdict}
          </p>
          <p className="mt-2 font-display text-[14px] font-semibold text-[var(--text-primary)]">
            {analysisResult.location.name}
          </p>
          <span className="mt-1 inline-flex rounded border border-[var(--brand-border)] bg-[var(--brand-subtle)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--brand-primary)]">
            {zone.code}
          </span>
          <div className="my-4 border-t border-[var(--border-subtle)]" />
          <KeyStat label="Cells analyzed" value={`${analysisResult.cells.length}`} />
          <KeyStat label="Top cluster" value={`${(bestCluster?.avg_score ?? 0).toFixed(1)}`} />
          <KeyStat label="Charger type" value={bestCell?.charger_recommendation?.label ?? "N/A"} />
          <KeyStat label="Timeline" value={timeline?.total_months ?? "N/A"} />
          <button
            type="button"
            onClick={() => void generatePdf()}
            className="mt-5 h-10 w-full rounded-lg bg-[var(--brand-primary)] font-display text-[13px] font-semibold text-white transition duration-150 hover:bg-[var(--brand-hover)]"
          >
            Download PDF Report
          </button>
        </aside>
      </div>
    </section>
  );
}

function KpiCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <article className="border-r border-[var(--border-subtle)] pr-3 last:border-r-0">
      <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">{label}</p>
      <p className="mt-1 font-display text-[24px] font-bold tracking-[-0.01em]" style={color ? { color } : undefined}>
        {value}
      </p>
    </article>
  );
}

function LineItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="font-body text-[12px] text-[var(--text-secondary)]">{label}</span>
      <span className="font-mono text-[12px] text-[var(--text-primary)]">{value}</span>
    </div>
  );
}

function KeyStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <span className="font-body text-[11px] text-[var(--text-secondary)]">{label}</span>
      <span className="font-mono text-[11px] text-[var(--text-primary)]">{value}</span>
    </div>
  );
}

function TimelineRows({ phases }: { phases: { label: string; weeks: number; color: string }[] }) {
  const total = phases.reduce((sum, phase) => sum + phase.weeks, 0) || 1;
  let runningTotal = 0;
  return (
    <div className="space-y-2">
      {phases.map((phase) => {
        runningTotal += phase.weeks;
        const widthPct = (phase.weeks / total) * 100;
        return (
          <div key={phase.label} className="flex items-center gap-3">
            <span className="w-[110px] shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
              {phase.label}
            </span>
            <div className="h-6 flex-1 rounded bg-[var(--bg-card-inner)]">
              <div
                className="flex h-full items-center rounded px-2 font-mono text-[10px] text-white"
                style={{ width: `${Math.max(8, widthPct)}%`, backgroundColor: phase.color }}
              >
                {phase.weeks} wks
              </div>
            </div>
            <span className="w-[56px] text-right font-mono text-[10px] text-[var(--text-tertiary)]">
              → Wk {runningTotal}
            </span>
          </div>
        );
      })}
    </div>
  );
}
