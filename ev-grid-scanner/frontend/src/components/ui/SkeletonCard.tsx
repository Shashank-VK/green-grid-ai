"use client";

export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="relative overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] p-3">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-[rgba(245,240,232,0.06)] to-transparent" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="h-3 rounded-full bg-[rgba(245,240,232,0.08)]"
            style={{ width: `${92 - index * 18}%` }}
          />
        ))}
      </div>
    </div>
  );
}
