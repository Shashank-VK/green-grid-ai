"use client";

import { InfoWindow, Marker } from "@react-google-maps/api";
import { useState } from "react";

import type { ChargerMarker } from "@/store/gridStore";
import { useGridStore } from "@/store/gridStore";

type ChargerMarkersProps = {
  chargers: ChargerMarker[];
};

export function ChargerMarkers({ chargers }: ChargerMarkersProps) {
  const showChargers = useGridStore((state) => state.showChargers);
  const mapZoom = useGridStore((state) => state.mapZoom);
  const [activeCharger, setActiveCharger] = useState<ChargerMarker | null>(null);

  if (!showChargers || mapZoom < 14) {
    return null;
  }

  return (
    <>
      {chargers.map((charger) => (
        <Marker
          key={charger.place_id}
          position={{ lat: charger.lat, lng: charger.lng }}
          label={{
            text: "⚡",
            color: "#D97757",
            fontSize: "24px",
            fontWeight: "700",
          }}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 0,
          }}
          onClick={() => setActiveCharger(charger)}
        />
      ))}

      {activeCharger ? (
        <InfoWindow
          position={{ lat: activeCharger.lat, lng: activeCharger.lng }}
          onCloseClick={() => setActiveCharger(null)}
        >
          <div className="max-w-[220px] text-sm text-[#252220]">
            <p className="font-semibold">{activeCharger.name}</p>
            <p>{activeCharger.vicinity}</p>
          </div>
        </InfoWindow>
      ) : null}
    </>
  );
}
