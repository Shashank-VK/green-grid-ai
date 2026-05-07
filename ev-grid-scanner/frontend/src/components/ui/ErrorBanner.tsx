"use client";

import { AlertTriangle, X } from "lucide-react";
import { useEffect, useState } from "react";

import { useGridStore } from "@/store/gridStore";

const ERROR_MAP: Record<string, string> = {
  LOCATION_NOT_FOUND: "Could not find that location. Try a nearby landmark.",
  LOCATION_OUTSIDE_BANGALORE: "greengrid supports Bangalore only. Try: Koramangala, Whitefield, Electronic City...",
  API_QUOTA_EXCEEDED: "Daily API budget exceeded. Switch to Mock Data mode or try tomorrow.",
  GEMMA_TIMEOUT: "AI analysis timed out. Using default scores.",
  NETWORK_ERROR: "Connection issue. Please check internet and try again.",
  UNKNOWN_ERROR: "Something went wrong. Please try again.",
};

export function ErrorBanner() {
  const searchError = useGridStore((state) => state.searchError);
  const clearError = useGridStore((state) => state.clearError);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!searchError || hovered) {
      return;
    }
    const id = window.setTimeout(clearError, 8000);
    return () => window.clearTimeout(id);
  }, [searchError, hovered, clearError]);

  if (!searchError) {
    return null;
  }

  const message = ERROR_MAP[searchError] ?? searchError;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="fixed left-0 right-0 top-[56px] z-[60] border-b border-[var(--danger)] bg-[rgba(192,57,43,0.12)] px-4 py-3 backdrop-blur"
    >
      <div className="mx-auto flex max-w-5xl items-center gap-3 text-sm text-[var(--text-primary)]">
        <AlertTriangle className="h-4 w-4 text-[var(--danger)]" />
        <p className="flex-1">{message}</p>
        <button type="button" aria-label="Dismiss error" onClick={clearError} className="rounded p-1 hover:bg-[rgba(201,95,95,0.2)]">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
