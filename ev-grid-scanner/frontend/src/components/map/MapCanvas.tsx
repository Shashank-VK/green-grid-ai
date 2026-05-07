"use client";

import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { useEffect, useMemo, useState } from "react";

import { ClusterHighlight } from "@/components/map/ClusterHighlight";
import { ChargerMarkers } from "@/components/map/ChargerMarkers";
import { FloodOverlay } from "@/components/map/FloodOverlay";
import { GridOverlay } from "@/components/map/GridOverlay";
import { getScoreFill, isSevereFloodCell } from "@/lib/scoreUtils";
import { GOOGLE_MAP_LIBRARIES, MINIMAL_MAP_STYLES } from "@/lib/mapUtils";
import { useGridStore } from "@/store/gridStore";

declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}

if (typeof window !== "undefined") {
  window.gm_authFailure = () => {
    window.dispatchEvent(new Event("gm-auth-failure"));
  };
}

export function MapCanvas() {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapsAuthFailed, setMapsAuthFailed] = useState(false);
  const mapCenter = useGridStore((state) => state.mapCenter);
  const mapZoom = useGridStore((state) => state.mapZoom);
  const mapType = useGridStore((state) => state.mapType);
  const gridCells = useGridStore((state) => state.gridCells);
  const analysisResult = useGridStore((state) => state.analysisResult);
  const setMapZoom = useGridStore((state) => state.setMapZoom);
  const setMapCenter = useGridStore((state) => state.setMapCenter);
  const selectCell = useGridStore((state) => state.selectCell);
  const selectedCellId = useGridStore((state) => state.selectedCellId);
  const selectedClusterId = useGridStore((state) => state.selectedClusterId);
  const clusters = analysisResult?.top_clusters ?? analysisResult?.clusters ?? [];
  const chargers = analysisResult?.chargers ?? [];

  const { isLoaded, loadError } = useJsApiLoader({
    id: "greengrid-google-map",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    libraries: GOOGLE_MAP_LIBRARIES,
  });

  useEffect(() => {
    function handleAuthFailure() {
      setMapsAuthFailed(true);
    }

    window.addEventListener("gm-auth-failure", handleAuthFailure);
    const intervalId = window.setInterval(() => {
      if (document.querySelector(".gm-err-container")) {
        setMapsAuthFailed(true);
      }
    }, 500);

    return () => {
      window.removeEventListener("gm-auth-failure", handleAuthFailure);
      window.clearInterval(intervalId);
    };
  }, []);

  const mapOptions = useMemo<google.maps.MapOptions>(
    () => ({
      styles: MINIMAL_MAP_STYLES,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      rotateControl: false,
      scaleControl: false,
      zoomControl: false,
      clickableIcons: false,
      disableDefaultUI: true,
      backgroundColor: "#FAF9F6",
      gestureHandling: "greedy",
    }),
    [isLoaded]
  );

  useEffect(() => {
    if (!map) {
      return;
    }

    map.panTo(mapCenter);
    map.setZoom(mapZoom);
    map.setMapTypeId(mapType);
  }, [map, mapCenter, mapZoom, mapType]);

  if (loadError || mapsAuthFailed) {
    return <StaticMapFallback />;
  }

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--bg-primary)] text-sm text-[var(--text-secondary)]">
        Google Maps failed to load.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--bg-primary)]">
        <div className="h-10 w-10 animate-pulse rounded-full border border-[var(--brand-primary)]" />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <GoogleMap
        mapContainerClassName="h-full w-full"
        center={mapCenter}
        zoom={mapZoom}
        mapTypeId={mapType}
        options={mapOptions}
        onLoad={setMap}
        onUnmount={() => setMap(null)}
        onZoomChanged={() => {
          const zoom = map?.getZoom();
          if (typeof zoom === "number") {
            setMapZoom(zoom);
          }
        }}
        onDragEnd={() => {
          const center = map?.getCenter();
          if (center) {
            setMapCenter({ lat: center.lat(), lng: center.lng() });
          }
        }}
        onClick={() => selectCell(null)}
      >
        <GridOverlay map={map} gridCells={gridCells} />
        <ClusterHighlight map={map} clusters={clusters} />
        <FloodOverlay />
        <ChargerMarkers chargers={chargers} />
      </GoogleMap>
      {selectedCellId || selectedClusterId ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/10 to-transparent" />
      ) : null}
    </div>
  );
}

function StaticMapFallback() {
  const mapCenter = useGridStore((state) => state.mapCenter);
  const mapZoom = useGridStore((state) => state.mapZoom);
  const gridCells = useGridStore((state) => state.gridCells);
  const selectedCellId = useGridStore((state) => state.selectedCellId);
  const selectCell = useGridStore((state) => state.selectCell);

  const gridRows = Math.max(
    1,
    ...gridCells.map((cell) => Math.max(1, cell.row.charCodeAt(0) - "A".charCodeAt(0) + 1))
  );
  const gridCols = Math.max(1, ...gridCells.map((cell) => Math.max(1, cell.col)));

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const mapUrl = `${apiBaseUrl}/api/v1/maps/static?lat=${mapCenter.lat}&lng=${mapCenter.lng}&zoom=${Math.min(
    20,
    Math.max(1, mapZoom)
  )}`;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[var(--bg-primary)]">
      <img
        src={mapUrl}
        alt="Static satellite terrain map"
        className="h-full w-full object-cover"
      />
      <div
        className="absolute inset-0 grid"
        style={{
          gridTemplateRows: `repeat(${gridRows}, minmax(0, 1fr))`,
          gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
        }}
      >
        {gridCells.map((cell) => {
          const isSelected = selectedCellId === cell.id;
          const hasScore = typeof cell.final_score === "number";
          const severeFlood = isSevereFloodCell(cell);
          const scoreFill = hasScore ? getScoreFill(cell.final_score ?? 0) : "rgba(255,255,255,0.03)";
          const fillStyle = severeFlood
            ? "repeating-linear-gradient(135deg, rgba(201,95,95,0.18) 0px, rgba(201,95,95,0.18) 6px, rgba(201,95,95,0.05) 6px, rgba(201,95,95,0.05) 12px)"
            : scoreFill;

          return (
            <button
              key={cell.id}
              type="button"
              title={`Cell ${cell.id}`}
              onClick={() => selectCell(cell.id)}
              className="relative border text-left transition duration-200 ease-out"
              style={{
                borderColor: severeFlood
                  ? "rgba(201,95,95,0.75)"
                  : isSelected
                    ? "rgba(217,119,87,0.9)"
                    : "rgba(245,240,232,0.2)",
                background: fillStyle,
                boxShadow: severeFlood ? "0 0 0 1px rgba(201,95,95,0.35) inset" : undefined,
              }}
            >
              {mapZoom >= 14 ? (
                <span className="absolute left-1 top-1 rounded bg-[rgba(15,12,10,0.70)] px-[3px] py-[2px] font-mono text-[9px] font-medium leading-none text-white">
                  {cell.id}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
