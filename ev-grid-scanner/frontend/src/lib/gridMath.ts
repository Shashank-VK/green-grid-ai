export const METERS_PER_DEGREE_LAT = 110_570;
export const METERS_PER_DEGREE_LNG = 107_480;
export const GRID_CELL_SIZE_METERS = 500;
export const DEFAULT_GRID_ROWS = 8;
export const DEFAULT_GRID_COLS = 10;
export const GRID_DELTA_LAT = GRID_CELL_SIZE_METERS / METERS_PER_DEGREE_LAT;
export const GRID_DELTA_LNG = GRID_CELL_SIZE_METERS / METERS_PER_DEGREE_LNG;

export type LatLngLiteral = {
  lat: number;
  lng: number;
};

export type CellScores = {
  s1_demand: number;
  s2_infra_gap: number;
  s3_grid_ready: number;
  s4_commercial: number;
  s5_strategic: number;
  s6_env_risk: number;
};

export type ChargerRecommendation = {
  type: string;
  label: string;
  power_kw: string | null;
  connector: string | null;
  recommended: boolean;
  warnings: string[];
};

export type CostEstimate = {
  charger_type: string;
  hardware_min: number;
  hardware_max: number;
  installation_min: number;
  installation_max: number;
  transformer_adder: number;
  flood_platform_adder: number;
  land_cost: number;
  fame_ii_note: string;
  total_min: number;
  total_max: number;
};

export type TimelineEstimate = {
  charger_type: string;
  approval_weeks: number;
  civil_weeks: number;
  commissioning_weeks: number;
  total_weeks: string;
  total_months: string;
  flags: string[];
};

export type FloodRisk = {
  bbmp_severe: boolean;
  bbmp_moderate: boolean;
  gemma_flood_score: number;
  gemma_tree_score: number;
  bbmp_zone?: string;
  distance_to_nearest_flood_m?: number | null;
};

export type NearbyPois = {
  restaurants: number;
  malls: number;
  hotels: number;
  theaters: number;
  tech_parks?: number;
};

export type GridCell = {
  id: string;
  row: string;
  col: number;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  center: LatLngLiteral;
  base_demand: number;
  vision_multiplier: number;
  grid_demand: number;
  existing_chargers_5km?: number;
  transformer_found?: boolean;
  nearest_transformer_m?: number | null;
  pois_nearby?: NearbyPois;
  road_type?: string;
  nearest_highway_m?: number;
  flood_risk?: FloodRisk;
  land_use?: string;
  gemma_flood_score?: number;
  gemma_tree_score?: number;
  gemma_notes?: string;
  visible_pois?: string[];
  highway_visible?: boolean;
  scores?: CellScores;
  final_score?: number;
  verdict?: string;
  category?: string;
  hard_gate_applied?: boolean;
  charger_recommendation?: ChargerRecommendation;
  cost_estimate?: CostEstimate;
  timeline?: TimelineEstimate;
  risk_warnings?: string[];
};

export function metersToDegreesLat(meters: number): number {
  return meters / METERS_PER_DEGREE_LAT;
}

export function metersToDegreesLng(meters: number): number {
  return meters / METERS_PER_DEGREE_LNG;
}

export function generateGrid(
  centerLat: number,
  centerLng: number,
  rows = DEFAULT_GRID_ROWS,
  cols = DEFAULT_GRID_COLS
): GridCell[] {
  const deltaLat = metersToDegreesLat(GRID_CELL_SIZE_METERS);
  const deltaLng = metersToDegreesLng(GRID_CELL_SIZE_METERS);
  const totalHeight = rows * deltaLat;
  const totalWidth = cols * deltaLng;
  const northEdge = centerLat + totalHeight / 2;
  const westEdge = centerLng - totalWidth / 2;
  const cells: GridCell[] = [];

  for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
    const row = String.fromCharCode("A".charCodeAt(0) + rowIndex);
    const north = northEdge - rowIndex * deltaLat;
    const south = north - deltaLat;

    for (let colIndex = 0; colIndex < cols; colIndex += 1) {
      const west = westEdge + colIndex * deltaLng;
      const east = west + deltaLng;
      const col = colIndex + 1;

      cells.push({
        id: `${row}${col}`,
        row,
        col,
        bounds: { north, south, east, west },
        center: {
          lat: (north + south) / 2,
          lng: (east + west) / 2,
        },
        base_demand: 0,
        vision_multiplier: 1.0,
        grid_demand: 0,
      });
    }
  }

  return cells;
}

export function populateGridDemand(cells: GridCell[], totalEvs: number): GridCell[] {
  const baseDemand = cells.length > 0 ? totalEvs / cells.length : 0;
  return cells.map((cell) => ({
    ...cell,
    base_demand: baseDemand,
    vision_multiplier: 1.0,
    grid_demand: baseDemand,
  }));
}
