"use client";

import { useJsApiLoader } from "@react-google-maps/api";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { GOOGLE_MAP_LIBRARIES } from "@/lib/mapUtils";
import { useGridStore } from "@/store/gridStore";

const RECENT_SEARCHES_KEY = "greengrid-recent-searches";

function readRecentSearches(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const value = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    return value ? (JSON.parse(value) as string[]) : [];
  } catch {
    return [];
  }
}

function writeRecentSearches(searches: string[]) {
  window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches.slice(0, 5)));
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const runAnalysis = useGridStore((state) => state.runAnalysis);
  const isSearching = useGridStore((state) => state.isSearching);
  const { isLoaded } = useJsApiLoader({
    id: "greengrid-google-map",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    libraries: GOOGLE_MAP_LIBRARIES,
  });

  useEffect(() => {
    setRecentSearches(readRecentSearches());
  }, []);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || !window.google?.maps?.places) {
      return;
    }

    let listener: google.maps.MapsEventListener | null = null;
    const timeoutId = window.setTimeout(() => {
      if (!inputRef.current || document.querySelector(".gm-err-container")) {
        return;
      }

      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        fields: ["formatted_address", "geometry", "name"],
        componentRestrictions: { country: "in" },
        bounds: {
          north: 13.3,
          south: 12.85,
          east: 77.8,
          west: 77.45,
        },
      });

      autocompleteRef.current = autocomplete;
      listener = autocomplete.addListener("place_changed", handlePlaceChanged);
    }, 1500);

    return () => {
      window.clearTimeout(timeoutId);
      if (listener) {
        google.maps.event.removeListener(listener);
      }
      autocompleteRef.current = null;
    };
  }, [isLoaded]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (!inputRef.current || !inputRef.current.classList.contains("gm-err-autocomplete")) {
        return;
      }

      inputRef.current.disabled = false;
      inputRef.current.placeholder = "Analyze Bangalore location";
      inputRef.current.classList.remove("gm-err-autocomplete");
    }, 500);

    return () => window.clearInterval(intervalId);
  }, []);

  async function submitSearch(value = query) {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }

    const nextSearches = [trimmed, ...recentSearches.filter((item) => item !== trimmed)].slice(0, 5);
    setRecentSearches(nextSearches);
    writeRecentSearches(nextSearches);
    await runAnalysis({
      location: trimmed,
      land_owned: true,
      grid_rows: 8,
      grid_cols: 10,
      analysis_mode: "deep",
    });
  }

  function handlePlaceChanged() {
    const place = autocompleteRef.current?.getPlace();
    const placeName = place?.formatted_address ?? place?.name ?? query;
    setQuery(placeName);
    void submitSearch(placeName);
  }

  return (
    <div className="relative w-full max-w-[480px]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void submitSearch();
            }
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            window.setTimeout(() => setIsFocused(false), 150);
          }}
          placeholder="Search any Bangalore locality..."
          className="h-9 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card-inner)] pl-9 pr-4 font-body text-[13px] text-[var(--text-primary)] outline-none transition duration-150 placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand-primary)] focus:shadow-[var(--shadow-coral)]"
        />
      </div>

      {recentSearches.length > 0 && isFocused ? (
        <div className="absolute left-0 right-0 top-11 z-50 rounded-xl border border-[var(--border-subtle)] bg-white p-2 shadow-[var(--shadow-elevated)]">
          {recentSearches.map((search) => (
            <button
              key={search}
              type="button"
              onClick={() => {
                setQuery(search);
                void submitSearch(search);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition duration-150 hover:bg-[var(--bg-hover)]"
            >
              <MapPinMini />
              <span className="truncate font-body text-[13px] text-[var(--text-primary)]">{search}</span>
            </button>
          ))}
        </div>
      ) : null}

      {isSearching ? (
        <div className="absolute -bottom-1 left-6 right-6 h-0.5 overflow-hidden rounded-full bg-transparent">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-[var(--brand-primary)]" />
        </div>
      ) : null}
    </div>
  );
}

function MapPinMini() {
  return <span className="text-[var(--text-tertiary)]">📍</span>;
}
