"use client";

import { Circle, InfoWindow } from "@react-google-maps/api";
import { useEffect, useState } from "react";

import { useGridStore } from "@/store/gridStore";

type FloodZone = {
  id: number;
  lat: number;
  lng: number;
  zone_name: string;
  vulnerability_level: string;
  bbmp_zone: string;
  notes?: string;
};

export function FloodOverlay() {
  const showFloodZones = useGridStore((state) => state.showFloodZones);
  const [zones, setZones] = useState<FloodZone[]>([]);
  const [activeZone, setActiveZone] = useState<FloodZone | null>(null);

  useEffect(() => {
    if (!showFloodZones || zones.length > 0) {
      return;
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    fetch(`${apiBaseUrl}/api/v1/flood-zones`)
      .then((response) => response.json())
      .then((payload) => setZones(payload.zones ?? []))
      .catch(() => setZones([]));
  }, [showFloodZones, zones.length]);

  if (!showFloodZones) {
    return null;
  }

  return (
    <>
      {zones.map((zone) => {
        const severe = zone.vulnerability_level.toLowerCase() === "severe";
        const color = severe ? "#C95F5F" : "#D4933A";
        return (
          <Circle
            key={zone.id}
            center={{ lat: zone.lat, lng: zone.lng }}
            radius={350}
            options={{
              fillColor: color,
              fillOpacity: severe ? 0.25 : 0.2,
              strokeColor: color,
              strokeOpacity: 0.8,
              strokeWeight: 1,
              clickable: true,
            }}
            onClick={() => setActiveZone(zone)}
          />
        );
      })}

      {activeZone ? (
        <InfoWindow
          position={{ lat: activeZone.lat, lng: activeZone.lng }}
          onCloseClick={() => setActiveZone(null)}
        >
          <div className="max-w-[220px] text-sm text-[#252220]">
            <p className="font-semibold">{activeZone.zone_name}</p>
            <p>{activeZone.vulnerability_level.toUpperCase()} flood risk</p>
            <p>{activeZone.notes ?? activeZone.bbmp_zone}</p>
          </div>
        </InfoWindow>
      ) : null}
    </>
  );
}
