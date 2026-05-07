"use client";

import { OverlayView, Polygon, Polyline } from "@react-google-maps/api";
import { Fragment } from "react";

import { FloatingClusterCard } from "@/components/ui/FloatingClusterCard";
import { getScoreColor } from "@/lib/scoreUtils";
import { useGridStore, type AnalysisCluster } from "@/store/gridStore";

type ClusterHighlightProps = {
  map: google.maps.Map | null;
  clusters: AnalysisCluster[];
};

function buildPath(bounds: AnalysisCluster["bounds"]): google.maps.LatLngLiteral[] {
  return [
    { lat: bounds.north, lng: bounds.west },
    { lat: bounds.north, lng: bounds.east },
    { lat: bounds.south, lng: bounds.east },
    { lat: bounds.south, lng: bounds.west },
    { lat: bounds.north, lng: bounds.west },
  ];
}

export function ClusterHighlight({ map, clusters }: ClusterHighlightProps) {
  const selectedClusterId = useGridStore((state) => state.selectedClusterId);
  const selectCluster = useGridStore((state) => state.selectCluster);
  const mapZoom = useGridStore((state) => state.mapZoom);

  if (!map || clusters.length === 0) {
    return null;
  }

  const rankedClusters = [...clusters].sort((a, b) => b.avg_score - a.avg_score);

  function focusCluster(cluster: AnalysisCluster) {
    if (!map) {
      return;
    }

    const bounds = new google.maps.LatLngBounds(
      { lat: cluster.bounds.south, lng: cluster.bounds.west },
      { lat: cluster.bounds.north, lng: cluster.bounds.east }
    );

    map.fitBounds(bounds, 80);
    selectCluster(cluster.cluster_id);
  }

  return (
    <>
      {rankedClusters.map((cluster, index) => {
        const path = buildPath(cluster.bounds);
        const isSelected = selectedClusterId === cluster.cluster_id;
        const color = getScoreColor(cluster.avg_score);
        const baseZIndex = isSelected ? 50 : index === 0 ? 30 : index === 1 ? 20 : 10;
        const labelPosition = {
          lat: cluster.bounds.north,
          lng: cluster.bounds.east,
        };
        const centerPosition = {
          lat: (cluster.bounds.north + cluster.bounds.south) / 2,
          lng: (cluster.bounds.east + cluster.bounds.west) / 2,
        };

        return (
          <Fragment key={`cluster-${cluster.cluster_id}`}>
            <Polygon
              path={path}
              onClick={() => focusCluster(cluster)}
              options={{
                clickable: true,
                fillOpacity: 0.06,
                fillColor: color,
                strokeOpacity: 0,
                zIndex: baseZIndex - 2,
              }}
            />
            <Polyline
              path={path}
              onClick={() => focusCluster(cluster)}
              options={{
                clickable: true,
                strokeColor: color,
                strokeOpacity: isSelected ? 1 : 0.9,
                strokeWeight: isSelected ? 3 : 2,
                geodesic: false,
                icons: [
                  {
                    icon: {
                      path: "M 0,-1 0,1",
                      strokeOpacity: 1,
                      strokeColor: color,
                      scale: 3,
                    },
                    offset: "0",
                    repeat: "10px",
                  },
                ],
                zIndex: baseZIndex - 1,
              }}
            />
            {mapZoom >= 13 ? (
              <OverlayView mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET} position={labelPosition}>
                <FloatingClusterCard
                  cluster={cluster}
                  onOpen={() => focusCluster(cluster)}
                  zIndex={baseZIndex}
                  selected={isSelected}
                />
              </OverlayView>
            ) : (
              <OverlayView mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET} position={centerPosition}>
                <button
                  type="button"
                  onClick={() => focusCluster(cluster)}
                  className="rounded-full border border-[var(--border-subtle)] bg-white/95 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-[var(--text-secondary)] shadow-sm"
                >
                  Cluster {cluster.cluster_id}
                </button>
              </OverlayView>
            )}
          </Fragment>
        );
      })}
    </>
  );
}
