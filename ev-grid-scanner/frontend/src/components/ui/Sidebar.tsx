"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { MapTypeToggle } from "@/components/map/MapTypeToggle";
import { SearchBar } from "@/components/ui/SearchBar";
import { DEFAULT_GRID_COLS, DEFAULT_GRID_ROWS } from "@/lib/gridMath";
import { useGridStore } from "@/store/gridStore";

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const currentRtoZone = useGridStore((state) => state.currentRtoZone);
  const isSearching = useGridStore((state) => state.isSearching);
  const gridCells = useGridStore((state) => state.gridCells);
  const analysisResult = useGridStore((state) => state.analysisResult);
  const useRealData = useGridStore((state) => state.useRealData);
  const showFloodZones = useGridStore((state) => state.showFloodZones);
  const showChargers = useGridStore((state) => state.showChargers);
  const setUseRealData = useGridStore((state) => state.setUseRealData);
  const setShowFloodZones = useGridStore((state) => state.setShowFloodZones);
  const setShowChargers = useGridStore((state) => state.setShowChargers);
  const cost = analysisResult?.api_cost;
  const estimatedCost = cost?.estimated_cost_inr ?? (gridCells.length * 3 * 2.65 + 0.17);
  const spent = cost?.today_cost_inr ?? 0;
  const budget = cost?.daily_budget_inr ?? 1000;
  const progress = Math.min(100, (spent / budget) * 100);

  return (
    <aside
      className={`z-10 flex h-full shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-secondary)] transition-[width] duration-200 ease-out ${
        isCollapsed ? "w-16" : "w-[250px]"
      }`}
    >
      <div className="flex h-14 items-center justify-between border-b border-[var(--border-subtle)] px-3">
        {!isCollapsed ? (
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">greengrid</p>
            <p className="text-[10px] uppercase text-[var(--text-tertiary)]">Grid System</p>
          </div>
        ) : null}
        <button
          type="button"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setIsCollapsed((value) => !value)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-[var(--text-secondary)] transition duration-200 ease-out hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {isCollapsed ? null : (
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4">
          <SearchBar />

          <section className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              Zone Identity
            </p>
            {isSearching ? (
              <div className="space-y-3">
                <div className="h-8 animate-pulse rounded bg-[rgba(217,119,87,0.18)]" />
                <div className="h-20 animate-pulse rounded bg-[rgba(217,119,87,0.10)]" />
              </div>
            ) : currentRtoZone ? (
              <div className="space-y-3 rounded-md border border-[var(--border-subtle)] bg-[rgba(37,34,32,0.7)] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-2xl font-semibold text-[var(--brand-primary)]">
                      {currentRtoZone.code}
                    </p>
                    <p className="text-sm text-[var(--text-primary)]">{currentRtoZone.office_name}</p>
                  </div>
                  <span className="rounded-full border border-[rgba(217,119,87,0.35)] px-2 py-1 text-[10px] uppercase text-[var(--brand-primary)]">
                    RTO
                  </span>
                </div>
                <div>
                  <p className="text-[11px] uppercase text-[var(--text-tertiary)]">Total EVs</p>
                  <p className="text-lg font-semibold text-[var(--text-primary)]">
                    {currentRtoZone.total_evs.toLocaleString("en-IN")}
                  </p>
                </div>
                <span className="inline-flex rounded-full bg-[rgba(245,240,232,0.07)] px-2.5 py-1 text-xs text-[var(--text-secondary)]">
                  {currentRtoZone.demand_profile}
                </span>
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-[var(--border-subtle)] p-3 text-sm leading-6 text-[var(--text-tertiary)]">
                Search a Bangalore location to begin analysis.
              </p>
            )}
          </section>

          <section className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              Grid Stats
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md border border-[var(--border-subtle)] bg-[rgba(37,34,32,0.55)] p-3">
                <p className="text-lg font-semibold">{gridCells.length}</p>
                <p className="text-xs text-[var(--text-tertiary)]">Cells</p>
              </div>
              <div className="rounded-md border border-[var(--border-subtle)] bg-[rgba(37,34,32,0.55)] p-3">
                <p className="text-lg font-semibold">{DEFAULT_GRID_ROWS}x{DEFAULT_GRID_COLS}</p>
                <p className="text-xs text-[var(--text-tertiary)]">Grid</p>
              </div>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">4km x 5km Coverage</p>
          </section>

          <section className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              Map Type
            </p>
            <MapTypeToggle />
          </section>

          <section className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              Intelligence Layers
            </p>
            <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={useRealData}
                onChange={(event) => setUseRealData(event.target.checked)}
                className="accent-[var(--brand-primary)]"
              />
              Use Real Places Data
            </label>
            <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={showFloodZones}
                onChange={(event) => setShowFloodZones(event.target.checked)}
                className="accent-[var(--brand-primary)]"
              />
              Show Flood Zones
            </label>
            <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={showChargers}
                onChange={(event) => setShowChargers(event.target.checked)}
                className="accent-[var(--brand-primary)]"
              />
              Show EV Chargers
            </label>
          </section>

          <section className="space-y-3 rounded-md border border-[var(--border-subtle)] bg-[rgba(37,34,32,0.55)] p-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">API Cost</p>
            <div className="space-y-1 text-sm">
              <p className="text-[var(--text-secondary)]">
                Est. Cost: <span className="font-mono text-[var(--text-primary)]">Rs {estimatedCost.toFixed(2)}</span>
              </p>
              <p className="text-[var(--text-secondary)]">
                Budget: <span className="font-mono text-[var(--text-primary)]">Rs {budget.toFixed(0)}</span>
              </p>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-primary)]">
              <div className="h-full rounded-full bg-[var(--brand-primary)]" style={{ width: `${progress}%` }} />
            </div>
          </section>
        </div>
      )}
    </aside>
  );
}
