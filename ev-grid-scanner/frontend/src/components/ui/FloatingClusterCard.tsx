"use client";

import { getScoreColor } from "@/lib/scoreUtils";
import type { AnalysisCluster } from "@/store/gridStore";
import { useGridStore } from "@/store/gridStore";

type FloatingClusterCardProps = {
  cluster: AnalysisCluster;
  onOpen: () => void;
  zIndex: number;
  selected: boolean;
};

export function FloatingClusterCard({ cluster, onOpen, zIndex, selected }: FloatingClusterCardProps) {
  const selectCluster = useGridStore((state) => state.selectCluster);
  const color = getScoreColor(cluster.avg_score);

  return (
    <button
      type="button"
      onClick={() => {
        selectCluster(cluster.cluster_id);
        onOpen();
      }}
      className="relative w-[160px] -translate-x-full translate-y-2 rounded-[10px] border border-[var(--border-subtle)] bg-white p-3 text-left shadow-[0_8px_24px_rgba(0,0,0,0.15)] transition duration-150 hover:-translate-y-0 hover:shadow-[0_12px_28px_rgba(0,0,0,0.2)]"
      style={{ zIndex }}
    >
      <span className="absolute left-0 right-0 top-0 h-[3px] rounded-t-[10px]" style={{ backgroundColor: color }} />
      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
        Cluster {cluster.cluster_id}
      </p>
      <p className="mt-1 font-display text-[28px] font-extrabold leading-none tracking-[-0.02em]" style={{ color }}>
        {cluster.avg_score.toFixed(1)}
      </p>
      <p className="mt-1 truncate font-body text-[11px] text-[var(--text-secondary)]">
        {cluster.charger_recommendation?.label ?? cluster.verdict}
      </p>
      <span className="mt-2 inline-flex border-t border-[var(--border-subtle)] pt-2 font-mono text-[11px] text-[var(--brand-primary)]">
        Full Analysis →
      </span>
      {selected ? (
        <span className="mt-2 block h-0.5 rounded-full" style={{ backgroundColor: color }} />
      ) : null}
    </button>
  );
}
