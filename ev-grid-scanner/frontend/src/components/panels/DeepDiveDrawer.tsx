"use client";

import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ZoneChat } from "@/components/chat/ZoneChat";
import type { GridCell } from "@/lib/gridMath";
import { getScoreColor, scoreToVerdict } from "@/lib/scoreUtils";
import { useGridStore, type AnalysisCluster } from "@/store/gridStore";

const TABS = ["Cluster Detail", "Cost Breakdown", "BESCOM Timeline", "Growth Projection", "AI Insight"] as const;

type DrawerTab = (typeof TABS)[number];

function formatInr(value: number): string {
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

function getTopFactor(cell?: GridCell | null): string {
  if (!cell?.scores) {
    return "N/A";
  }
  const entries = [
    ["Demand", cell.scores.s1_demand],
    ["Infra Gap", cell.scores.s2_infra_gap],
    ["Grid Ready", cell.scores.s3_grid_ready],
    ["Commercial", cell.scores.s4_commercial],
    ["Strategic", cell.scores.s5_strategic],
  ] as const;
  return [...entries].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";
}

function buildPhases(timeline?: GridCell["timeline"]) {
  return [
    { label: "Feasibility", weeks: 2, color: "#D4933A" },
    { label: "BESCOM Load", weeks: timeline?.approval_weeks ?? 0, color: "#D97757" },
    { label: "CEIG Approval", weeks: 4, color: "#C4603E" },
    { label: "Civil Works", weeks: timeline?.civil_weeks ?? 0, color: "#B45309" },
    { label: "Commissioning", weeks: timeline?.commissioning_weeks ?? 0, color: "#92400E" },
  ];
}

export function DeepDiveDrawer() {
  const [activeTab, setActiveTab] = useState<DrawerTab>("Cluster Detail");
  const analysisResult = useGridStore((state) => state.analysisResult);
  const selectedCellId = useGridStore((state) => state.selectedCellId);
  const selectedClusterId = useGridStore((state) => state.selectedClusterId);
  const selectCell = useGridStore((state) => state.selectCell);
  const selectCluster = useGridStore((state) => state.selectCluster);

  const selectedCluster = useMemo(() => {
    if (!analysisResult) {
      return null;
    }
    const allClusters = [...(analysisResult.top_clusters ?? []), ...(analysisResult.clusters ?? [])];
    return allClusters.find((cluster) => cluster.cluster_id === selectedClusterId) ?? null;
  }, [analysisResult, selectedClusterId]);

  const selectedCell = useMemo(() => {
    if (!analysisResult) {
      return null;
    }
    return analysisResult.cells.find((cell) => cell.id === selectedCellId) ?? null;
  }, [analysisResult, selectedCellId]);

  const inferredCluster = useMemo(() => {
    if (!analysisResult || selectedCluster || !selectedCell) {
      return selectedCluster;
    }
    const allClusters = [...(analysisResult.top_clusters ?? []), ...(analysisResult.clusters ?? [])];
    return allClusters.find((cluster) => cluster.cell_ids.includes(selectedCell.id)) ?? null;
  }, [analysisResult, selectedCell, selectedCluster]);

  const clusterCells = useMemo(() => {
    if (!analysisResult) {
      return [];
    }
    if (inferredCluster) {
      return inferredCluster.cell_ids
        .map((cellId) => analysisResult.cells.find((cell) => cell.id === cellId))
        .filter((cell): cell is GridCell => Boolean(cell));
    }
    return selectedCell ? [selectedCell] : [];
  }, [analysisResult, inferredCluster, selectedCell]);

  const bestCell = useMemo(
    () =>
      clusterCells.reduce<GridCell | null>(
        (best, cell) => (!best || (cell.final_score ?? 0) > (best.final_score ?? 0) ? cell : best),
        null
      ),
    [clusterCells]
  );

  const drawerOpen = Boolean(analysisResult && (selectedCellId || selectedClusterId));
  const scoreValue = bestCell?.final_score ?? inferredCluster?.avg_score ?? 0;
  const verdict = bestCell?.verdict ?? scoreToVerdict(scoreValue);
  const verdictColor = getScoreColor(scoreValue);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 transition-transform duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
        drawerOpen ? "translate-y-0" : "translate-y-full"
      }`}
    >
      {drawerOpen ? (
        <button
          type="button"
          aria-label="Close deep dive backdrop"
          className="fixed inset-0 -top-[100vh] -z-10 bg-black/15"
          onClick={() => {
            selectCell(null);
            selectCluster(null);
          }}
        />
      ) : null}

      <section className="h-[55vh] min-h-[400px] max-h-[600px] overflow-hidden border-t border-[var(--border-subtle)] bg-white shadow-[0_-8px_32px_rgba(0,0,0,0.1)]">
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-[var(--border-strong)]" />

        <header className="flex h-12 items-center justify-between px-6">
          <div>
            <p className="font-display text-[18px] font-bold tracking-[-0.01em] text-[var(--text-primary)]">
              {inferredCluster ? `Cluster ${inferredCluster.cluster_id}` : bestCell ? `Cell ${bestCell.id}` : "Details"}
            </p>
            <span
              className="rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em]"
              style={{ color: verdictColor, borderColor: verdictColor, backgroundColor: `${verdictColor}14` }}
            >
              {verdict}
            </span>
          </div>
          <button
            type="button"
            aria-label="Close deep dive drawer"
            onClick={() => {
              selectCell(null);
              selectCluster(null);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-card-inner)] text-[var(--text-tertiary)] transition duration-150 hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <nav className="flex h-11 items-center border-b border-[var(--border-subtle)] px-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`mr-2 h-11 rounded-t px-3 font-mono text-[10px] uppercase tracking-[0.06em] transition duration-150 ${
                activeTab === tab
                  ? "border-b-2 border-[var(--brand-primary)] text-[var(--brand-primary)]"
                  : "text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>

        <div className="h-[calc(55vh-103px)] min-h-[297px] max-h-[497px] overflow-y-auto px-6 py-5">
          {activeTab === "Cluster Detail" ? (
            <ClusterDetailTab cells={clusterCells} bestCell={bestCell} cluster={inferredCluster} />
          ) : null}
          {activeTab === "Cost Breakdown" ? (
            <CostBreakdownTab bestCell={bestCell} cluster={inferredCluster} />
          ) : null}
          {activeTab === "BESCOM Timeline" ? (
            <TimelineTab bestCell={bestCell} cluster={inferredCluster} />
          ) : null}
          {activeTab === "Growth Projection" ? <GrowthProjectionTab /> : null}
          {activeTab === "AI Insight" ? <ZoneChat variant="compact" /> : null}
        </div>
      </section>
    </div>
  );
}

function ClusterDetailTab({
  cells,
  bestCell,
  cluster,
}: {
  cells: GridCell[];
  bestCell: GridCell | null;
  cluster: AnalysisCluster | null;
}) {
  const score = bestCell?.final_score ?? cluster?.avg_score ?? 0;
  const color = getScoreColor(score);
  const chargerType = bestCell?.charger_recommendation?.label ?? cluster?.charger_recommendation?.label ?? "N/A";
  return (
    <div className="grid gap-5 lg:grid-cols-[60%_40%]">
      <div>
        <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
          Cells In This Cluster
        </p>
        <div className="overflow-hidden rounded-lg border border-[var(--border-subtle)]">
          <table className="w-full border-collapse">
            <thead className="bg-[var(--bg-card-inner)]">
              <tr>
                <th className="px-3 py-2 text-left font-mono text-[9px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                  Cell
                </th>
                <th className="px-3 py-2 text-left font-mono text-[9px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                  Score
                </th>
                <th className="px-3 py-2 text-left font-mono text-[9px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                  Verdict
                </th>
                <th className="px-3 py-2 text-left font-mono text-[9px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                  Top Factor
                </th>
              </tr>
            </thead>
            <tbody>
              {cells.map((cell, index) => {
                const rowScore = cell.final_score ?? 0;
                const rowColor = getScoreColor(rowScore);
                const isBest = bestCell?.id === cell.id;
                return (
                  <tr
                    key={cell.id}
                    className={index % 2 ? "bg-[var(--bg-card-inner)]" : "bg-white"}
                    style={isBest ? { boxShadow: `inset 3px 0 0 ${rowColor}` } : undefined}
                  >
                    <td className="px-3 py-2 font-mono text-[12px] text-[var(--text-primary)]">{cell.id}</td>
                    <td className="px-3 py-2 font-display text-[14px] font-semibold" style={{ color: rowColor }}>
                      {rowScore.toFixed(2)}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className="rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em]"
                        style={{ color: rowColor, borderColor: rowColor, backgroundColor: `${rowColor}14` }}
                      >
                        {scoreToVerdict(rowScore)}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-body text-[11px] text-[var(--text-secondary)]">{getTopFactor(cell)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Cluster Score" value={score.toFixed(2)} color={color} />
          <StatCard label="Best Cell" value={bestCell?.id ?? "N/A"} />
          <StatCard label="Charger Type" value={chargerType} />
          <StatCard label="Cells Count" value={`${cells.length}`} />
        </div>
      </div>
    </div>
  );
}

function CostBreakdownTab({ bestCell, cluster }: { bestCell: GridCell | null; cluster: AnalysisCluster | null }) {
  const cost = bestCell?.cost_estimate ?? cluster?.cost_estimate;
  if (!cost) {
    return <p className="font-body text-[13px] text-[var(--text-secondary)]">Cost breakdown appears after scoring.</p>;
  }
  return (
    <div className="mx-auto max-w-[760px]">
      <p className="text-center font-display text-[36px] font-extrabold tracking-[-0.02em] text-[var(--brand-primary)]">
        {formatInr(cost.total_min)} – {formatInr(cost.total_max)}
      </p>
      <p className="text-center font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
        Total Estimated Cost
      </p>
      <div className="mt-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card-inner)] p-4">
        <LineRow label="Equipment" value={`${formatInr(cost.hardware_min)} – ${formatInr(cost.hardware_max)}`} />
        <LineRow
          label="Installation"
          value={`${formatInr(cost.installation_min)} – ${formatInr(cost.installation_max)}`}
        />
        <LineRow label="Transformer (if required)" value={formatInr(cost.transformer_adder)} />
        <div className="mt-2 border-t-2 border-[var(--border-subtle)] pt-2">
          <LineRow label="Total" value={`${formatInr(cost.total_min)} – ${formatInr(cost.total_max)}`} strong />
        </div>
      </div>
      {cost.transformer_adder > 0 ? (
        <div className="mt-3 rounded-lg border border-[rgba(212,147,58,0.3)] bg-[#FFFBEB] px-3 py-2 font-body text-[12px] text-[#92400E]">
          BESCOM transformer upgrade may be needed. Add {formatInr(cost.transformer_adder)} to budget.
        </div>
      ) : null}
      <p className="mt-3 font-body text-[11px] italic text-[var(--text-tertiary)]">
        FAME-II subsidy may apply — verify current scheme status with BESCOM.
      </p>
    </div>
  );
}

function TimelineTab({ bestCell, cluster }: { bestCell: GridCell | null; cluster: AnalysisCluster | null }) {
  const timeline = bestCell?.timeline ?? cluster?.timeline;
  if (!timeline) {
    return <p className="font-body text-[13px] text-[var(--text-secondary)]">Timeline appears after scoring.</p>;
  }
  const phases = buildPhases(timeline);
  const maxWeeks = Math.max(...phases.map((phase) => phase.weeks), 1);
  let runningWeeks = 0;
  return (
    <div className="space-y-3">
      <p className="font-display text-[15px] font-semibold text-[var(--text-primary)]">Approval & Deployment Timeline</p>
      {phases.map((phase) => {
        runningWeeks += phase.weeks;
        const widthPct = Math.max(8, (phase.weeks / maxWeeks) * 100);
        return (
          <div key={phase.label} className="flex items-center gap-3">
            <span className="w-[120px] shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
              {phase.label}
            </span>
            <div className="h-7 flex-1 rounded bg-[var(--bg-card-inner)]">
              <div
                className="flex h-full items-center rounded px-2 font-mono text-[10px] text-white"
                style={{ width: `${widthPct}%`, backgroundColor: phase.color }}
              >
                {phase.weeks} wks
              </div>
            </div>
            <span className="w-[58px] text-right font-mono text-[10px] text-[var(--text-tertiary)]">→ Wk {runningWeeks}</span>
          </div>
        );
      })}
      <p className="font-mono text-[11px] text-[var(--text-secondary)]">Total: {timeline.total_months} months estimated</p>
      <div className="rounded-lg border border-[rgba(212,147,58,0.3)] bg-[#FFFBEB] px-3 py-2 font-body text-[12px] text-[#92400E]">
        Key delay: BESCOM load sanction is typically longest. Start it before hardware procurement.
      </div>
    </div>
  );
}

function GrowthProjectionTab() {
  const growthProjection = useGridStore((state) => state.analysisResult?.growth_projection);
  if (!growthProjection) {
    return <p className="font-body text-[13px] text-[var(--text-secondary)]">Growth projection appears after analysis.</p>;
  }
  const data = [
    { year: "Now", evs: growthProjection.current_evs },
    ...Object.entries(growthProjection.projected).map(([year, evs]) => ({ year, evs })),
  ];
  return (
    <div>
      <div className="h-[220px] rounded-lg border border-[var(--border-subtle)] bg-white p-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <defs>
              <linearGradient id="drawerCoralGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D97757" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#D97757" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#F0EDE8" strokeDasharray="3 3" />
            <XAxis dataKey="year" tick={{ fontFamily: "DM Mono", fontSize: 10, fill: "#9C8E84" }} />
            <YAxis
              tick={{ fontFamily: "DM Mono", fontSize: 10, fill: "#9C8E84" }}
              tickFormatter={(value: number) => (value >= 1000 ? `${(value / 1000).toFixed(0)}k` : `${value}`)}
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
            <Area type="monotone" dataKey="evs" stroke="#D97757" strokeWidth={2} fill="url(#drawerCoralGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 font-body text-[12px] leading-6 text-[var(--text-secondary)]">
        Based on Karnataka EV growth trends, this zone is projected to see meaningful demand increase by 2028–2030.
      </p>
    </div>
  );
}

function LineRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--border-subtle)] py-2 last:border-b-0">
      <span className={`font-body text-[13px] ${strong ? "font-semibold text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
        {label}
      </span>
      <span className={`font-mono text-[13px] ${strong ? "text-[var(--brand-primary)]" : "text-[var(--text-primary)]"}`}>
        {value}
      </span>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <article className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card-inner)] p-3">
      <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">{label}</p>
      <p className="mt-1 font-display text-[20px] font-semibold tracking-[-0.01em]" style={color ? { color } : undefined}>
        {value}
      </p>
    </article>
  );
}
