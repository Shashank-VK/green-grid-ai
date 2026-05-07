import type { Libraries } from "@react-google-maps/api";

export const DEFAULT_CENTER = { lat: 12.9716, lng: 77.5946 };
export const DEFAULT_ZOOM = 14;
export const GOOGLE_MAP_LIBRARIES: Libraries = ["places"];

export const MINIMAL_MAP_STYLES: google.maps.MapTypeStyle[] = [
  {
    featureType: "all",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
];

export function formatCoordinate(value: number): string {
  return value.toFixed(6);
}
