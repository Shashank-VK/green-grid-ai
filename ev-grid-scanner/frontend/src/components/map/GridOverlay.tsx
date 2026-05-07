"use client";

import { OverlayView, Polygon } from "@react-google-maps/api";
import { useCallback, useState } from "react";

import type { GridCell } from "@/lib/gridMath";
import { getScoreColor } from "@/lib/scoreUtils";
import { useGridStore } from "@/store/gridStore";

type GridOverlayProps = {
  map: google.maps.Map | null;
  gridCells: GridCell[];
};

function polygonPath(cell: GridCell): google.maps.LatLngLiteral[] {
  return [
    { lat: cell.bounds.north, lng: cell.bounds.west },
    { lat: cell.bounds.north, lng: cell.bounds.east },
    { lat: cell.bounds.south, lng: cell.bounds.east },
    { lat: cell.bounds.south, lng: cell.bounds.west },
  ];
}

export function GridOverlay({ map, gridCells }: GridOverlayProps) {
  const [hoveredCellId, setHoveredCellId] = useState<string | null>(null);
  const selectedCellId = useGridStore((state) => state.selectedCellId);
  const selectCell = useGridStore((state) => state.selectCell);
  const mapZoom = useGridStore((state) => state.mapZoom);
  const mapType = useGridStore((state) => state.mapType);
  const setMapCenter = useGridStore((state) => state.setMapCenter);
  const setMapZoom = useGridStore((state) => state.setMapZoom);

  const handleSelectCell = useCallback(
    (cellId: string, event?: google.maps.MapMouseEvent) => {
      event?.domEvent?.stopPropagation();
      selectCell(cellId);
    },
    [selectCell]
  );

  if (!map) {
    return null;
  }

  return (
    <>
      {gridCells.map((cell) => {
        const isHovered = hoveredCellId === cell.id;
        const isSelected = selectedCellId === cell.id;
        const hasScore = typeof cell.final_score === "number";
        const color = hasScore ? getScoreColor(cell.final_score ?? 0) : "#1C1917";

        const strokeOpacity = isSelected || isHovered ? 1 : hasScore ? 0.6 : 0.18;
        const strokeWeight = isSelected || isHovered ? 2 : 1;
        const fillOpacity = isSelected ? 0.62 : isHovered ? 0.55 : hasScore ? 0.25 : 0.02;
        const zIndex = isSelected ? 6 : isHovered ? 5 : 3;

        return (
          <Polygon
            key={cell.id}
            path={polygonPath(cell)}
            onClick={(event) => handleSelectCell(cell.id, event)}
            onDblClick={() => {
              setMapCenter(cell.center);
              setMapZoom(Math.min(20, mapZoom + 2));
            }}
            onMouseDown={() => {
              const id = window.setTimeout(() => selectCell(cell.id), 500);
              const clear = () => window.clearTimeout(id);
              window.addEventListener("mouseup", clear, { once: true });
              window.addEventListener("touchend", clear, { once: true });
            }}
            onMouseOver={() => setHoveredCellId(cell.id)}
            onMouseOut={() => setHoveredCellId(null)}
            options={{
              clickable: true,
              strokeColor: color,
              strokeOpacity,
              strokeWeight,
              fillColor: color,
              fillOpacity,
              zIndex,
            }}
          />
        );
      })}

      {mapZoom >= 13
        ? gridCells.map((cell) => (
            <OverlayView
              key={`${cell.id}-label`}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              position={{ lat: cell.bounds.north, lng: cell.bounds.west }}
            >
              <button
                type="button"
                title={`Cell ${cell.id}`}
                onClick={() => selectCell(cell.id)}
                className="translate-x-1 translate-y-1 cursor-pointer select-none rounded px-[5px] py-[2px] font-mono text-[9px] font-medium leading-none shadow-sm transition duration-100"
                style={
                  mapType === "satellite"
                    ? { backgroundColor: "rgba(0,0,0,0.60)", color: "#FFFFFF" }
                    : { backgroundColor: "rgba(255,255,255,0.85)", color: "#1C1917" }
                }
              >
                {cell.id}
              </button>
            </OverlayView>
          ))
        : null}
    </>
  );
}
