"use client";

import { Download, Layers, Map, MapPin } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { SearchBar } from "@/components/ui/SearchBar";
import { useGridStore } from "@/store/gridStore";

const VIEWS = ["map", "report", "chat"] as const;
type View = (typeof VIEWS)[number];

export function CommandBar() {
  const analysisResult = useGridStore((state) => state.analysisResult);
  const activeView = useGridStore((state) => state.activeView);
  const setActiveView = useGridStore((state) => state.setActiveView);
  const mapType = useGridStore((state) => state.mapType);
  const setMapType = useGridStore((state) => state.setMapType);
  const setShowFloodZones = useGridStore((state) => state.setShowFloodZones);
  const showFloodZones = useGridStore((state) => state.showFloodZones);
  const generatePdf = useGridStore((state) => state.generatePdf);
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);

  function cycleMapType() {
    setMapType(mapType === "satellite" ? "terrain" : mapType === "terrain" ? "roadmap" : "satellite");
  }

  useEffect(() => {
    let mounted = true;
    async function pingBackend() {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/health`);
        if (!mounted) {
          return;
        }
        setBackendConnected(response.ok);
      } catch {
        if (mounted) {
          setBackendConnected(false);
        }
      }
    }

    void pingBackend();
    const intervalId = window.setInterval(() => {
      void pingBackend();
    }, 10000);
    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <header className="relative z-40 grid h-[56px] grid-cols-[1fr_auto] items-center gap-3 border-b border-[var(--border-subtle)] bg-white px-3 md:grid-cols-[minmax(260px,1fr)_minmax(320px,500px)_minmax(300px,1fr)] md:px-5">
      <div className="hidden min-w-0 items-center gap-3 md:flex">
        <div className="flex items-center gap-2">
          <span className="text-[var(--brand-primary)]">⚡</span>
          <div className="font-display text-[15px] font-bold tracking-[-0.01em] text-[var(--text-primary)]">greengrid</div>
        </div>
        <span className="h-5 w-px bg-[var(--border-subtle)]" />
        {analysisResult?.location?.name ? (
          <div className="inline-flex items-center gap-1 rounded-full border border-[var(--brand-border)] bg-[var(--brand-subtle)] px-3 py-1 font-body text-[12px] font-medium text-[var(--brand-primary)]">
            <MapPin className="h-3 w-3" />
            <span>{analysisResult.location.name}</span>
          </div>
        ) : null}
      </div>
      <div className="flex min-w-0 justify-start md:justify-center">
        <SearchBar />
      </div>
      <div className="flex items-center justify-end gap-2">
        <div className="hidden items-center gap-1 border-r border-[var(--border-subtle)] pr-2 md:flex">
          {VIEWS.map((view) => (
            <ViewTab
              key={view}
              label={view}
              isActive={activeView === view}
              onClick={() => setActiveView(view as View)}
            />
          ))}
        </div>
        <IconButton
          label={`Map type: ${mapType}`}
          active={mapType !== "satellite"}
          onClick={cycleMapType}
        >
          <Map className="h-4 w-4" />
        </IconButton>
        <IconButton
          label="Toggle layers"
          active={showFloodZones}
          onClick={() => setShowFloodZones(!showFloodZones)}
        >
          <Layers className="h-4 w-4" />
        </IconButton>
        <IconButton label="Download report" onClick={() => void generatePdf()}>
          <Download className="h-4 w-4" />
        </IconButton>
        <span
          title={backendConnected ? "Backend Connected" : "Backend Disconnected"}
          className={`ml-1 inline-block h-2 w-2 rounded-full ${
            backendConnected === null
              ? "animate-pulse bg-amber-400"
              : backendConnected
                ? "bg-emerald-500"
                : "bg-red-500"
          }`}
        />
      </div>
    </header>
  );
}

function IconButton({
  label,
  onClick,
  children,
  active = false,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-lg border text-[var(--text-tertiary)] transition duration-150 hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] active:scale-[0.98] ${
        active
          ? "border-[var(--brand-border)] bg-[var(--brand-subtle)] text-[var(--brand-primary)]"
          : "border-[var(--border-subtle)] bg-transparent"
      }`}
    >
      {children}
    </button>
  );
}

function ViewTab({ label, isActive, onClick }: { label: View; isActive: boolean; onClick: () => void }) {
  const displayLabel = label.charAt(0).toUpperCase() + label.slice(1);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] transition duration-150 ${
        isActive
          ? "bg-[var(--brand-subtle)] text-[var(--brand-primary)]"
          : "text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
      }`}
    >
      {displayLabel}
    </button>
  );
}
