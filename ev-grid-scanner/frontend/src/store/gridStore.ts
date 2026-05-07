import { create } from "zustand";

import {
  DEFAULT_GRID_COLS,
  DEFAULT_GRID_ROWS,
  type CostEstimate,
  type GridCell,
  type LatLngLiteral,
  type TimelineEstimate,
  generateGrid,
  populateGridDemand,
} from "@/lib/gridMath";
import { DEFAULT_CENTER, DEFAULT_ZOOM } from "@/lib/mapUtils";

export type MapType = "satellite" | "terrain" | "roadmap";

export type RTOZone = {
  code: string;
  name: string;
  office_name: string;
  total_evs: number;
  demand_profile: string;
};

export type AnalysisCluster = {
  cluster_id: number;
  cell_ids: string[];
  avg_score: number;
  verdict: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  max_strategic_access?: number;
  rank_score?: number;
  label?: string;
  best_cell_id?: string;
  charger_recommendation?: GridCell["charger_recommendation"];
  cost_estimate?: CostEstimate;
  timeline?: TimelineEstimate;
};

export type AnalysisSummary = {
  total_cells: number;
  cells_analyzed: number;
  high_priority_cells: number;
  viable_cells: number;
  marginal_cells: number;
  not_recommended_cells: number;
};

export type AnalysisResult = {
  status: string;
  session_id?: string;
  analysis_mode: "quick" | "deep";
  land_owned: boolean;
  use_real_data?: boolean;
  use_vision?: boolean;
  api_cost?: ApiCostStatus;
  location: {
    name: string;
    lat: number;
    lng: number;
    formatted_address: string;
  };
  rto_zone: RTOZone;
  analysis_summary: AnalysisSummary;
  cells: GridCell[];
  chargers?: ChargerMarker[];
  top_clusters: AnalysisCluster[];
  clusters: AnalysisCluster[];
  growth_projection?: GrowthProjection;
};

export type ChargerMarker = {
  place_id: string;
  name: string;
  lat: number;
  lng: number;
  vicinity: string;
};

export type GrowthProjection = {
  current_evs: number;
  projected: Record<string, number>;
  growth_rate_cagr: number;
  flag: string | null;
  confidence: string;
};

export type ApiCostStatus = {
  today_cost_inr?: number;
  daily_budget_inr?: number;
  remaining_inr?: number;
  estimated_cost_inr?: number;
};

export type AnalysisStatus = "idle" | "running" | "complete" | "error";
export type AppView = "map" | "report" | "chat";
export type UiChatMessage = { role: "user" | "assistant"; content: string; created_at: string };

type GeocodeResponse = {
  lat: number;
  lng: number;
  formatted_address: string;
  rto_zone: RTOZone;
};

type AnalyzePayload = {
  location: string;
  land_owned?: boolean;
  grid_rows?: number;
  grid_cols?: number;
  analysis_mode?: "quick" | "deep";
  use_real_data?: boolean;
};

type GridStore = {
  activeView: AppView;
  mapCenter: LatLngLiteral;
  mapZoom: number;
  mapType: MapType;
  gridCells: GridCell[];
  selectedCellId: string | null;
  selectedClusterId: number | null;
  currentRtoZone: RTOZone | null;
  analysisResult: AnalysisResult | null;
  analysisStatus: AnalysisStatus;
  isSearching: boolean;
  searchError: string | null;
  useRealData: boolean;
  showFloodZones: boolean;
  showChargers: boolean;
  pdfUrl: string | null;
  isGeneratingPdf: boolean;
  analysisTarget: string | null;
  chatMessages: UiChatMessage[];
  setActiveView: (view: AppView) => void;
  setChatMessages: (messages: UiChatMessage[]) => void;
  appendChatMessage: (message: Omit<UiChatMessage, "created_at">) => void;
  clearChat: () => void;
  setMapCenter: (center: LatLngLiteral) => void;
  setMapZoom: (zoom: number) => void;
  setMapType: (mapType: MapType) => void;
  setGridCells: (gridCells: GridCell[]) => void;
  selectCell: (cellId: string | null) => void;
  selectCluster: (clusterId: number | null) => void;
  setRtoZone: (zone: RTOZone | null) => void;
  setAnalysisResult: (result: AnalysisResult | null) => void;
  setUseRealData: (value: boolean) => void;
  setShowFloodZones: (value: boolean) => void;
  setShowChargers: (value: boolean) => void;
  setPdfUrl: (url: string | null) => void;
  clearError: () => void;
  cancelAnalysis: () => void;
  generatePdf: () => Promise<void>;
  runAnalysis: (payload: AnalyzePayload) => Promise<void>;
  searchLocation: (location: string | LatLngLiteral) => Promise<void>;
};

function buildDefaultGrid(): GridCell[] {
  return generateGrid(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng, DEFAULT_GRID_ROWS, DEFAULT_GRID_COLS);
}

function apiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
}

export const useGridStore = create<GridStore>((set) => ({
  activeView: "map",
  mapCenter: DEFAULT_CENTER,
  mapZoom: DEFAULT_ZOOM,
  mapType: "satellite",
  gridCells: buildDefaultGrid(),
  selectedCellId: null,
  selectedClusterId: null,
  currentRtoZone: null,
  analysisResult: null,
  analysisStatus: "idle",
  isSearching: false,
  searchError: null,
  useRealData: false,
  showFloodZones: false,
  showChargers: true,
  pdfUrl: null,
  isGeneratingPdf: false,
  analysisTarget: null,
  chatMessages: [],
  setActiveView: (view) => set({ activeView: view }),
  setChatMessages: (messages) => set({ chatMessages: messages }),
  appendChatMessage: (message) =>
    set((state) => ({
      chatMessages: [
        ...state.chatMessages,
        {
          ...message,
          created_at: new Date().toISOString(),
        },
      ],
    })),
  clearChat: () => set({ chatMessages: [] }),
  setMapCenter: (center) => set({ mapCenter: center }),
  setMapZoom: (zoom) => set({ mapZoom: zoom }),
  setMapType: (mapType) => set({ mapType }),
  setGridCells: (gridCells) => set({ gridCells }),
  selectCell: (cellId) => set({ selectedCellId: cellId, selectedClusterId: null }),
  selectCluster: (clusterId) => set({ selectedClusterId: clusterId, selectedCellId: null }),
  setRtoZone: (zone) => set({ currentRtoZone: zone }),
  setUseRealData: (value) => set({ useRealData: value }),
  setShowFloodZones: (value) => set({ showFloodZones: value }),
  setShowChargers: (value) => set({ showChargers: value }),
  setPdfUrl: (url) => set({ pdfUrl: url }),
  clearError: () => set({ searchError: null }),
  cancelAnalysis: () => set({ analysisStatus: "idle", isSearching: false }),
  setAnalysisResult: (result) =>
    set((state) => ({
      analysisResult: result,
      gridCells: result?.cells ?? state.gridCells,
      analysisStatus: result ? "complete" : "idle",
      selectedClusterId: null,
      selectedCellId: null,
    })),
  generatePdf: async () => {
    const state = useGridStore.getState();
    const sessionId = state.analysisResult?.session_id;
    if (!sessionId) {
      return;
    }

    set({ isGeneratingPdf: true });
    try {
      const response = await fetch(`${apiBaseUrl()}/api/v1/report/${sessionId}`, { method: "POST" });
      if (!response.ok) {
        throw new Error("PDF generation failed.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const zoneName = state.analysisResult?.location?.name ?? "Analysis";
      const safeZoneName = zoneName.trim().replace(/\s+/g, "-");
      const today = new Date().toISOString().split("T")[0];
      anchor.href = url;
      anchor.download = `greengrid-${safeZoneName}-${today}.pdf`;
      anchor.click();
      set({ pdfUrl: url, isGeneratingPdf: false });
    } catch (error) {
      set({
        isGeneratingPdf: false,
        searchError: error instanceof Error ? error.message : "PDF generation failed.",
      });
    }
  },
  runAnalysis: async (payload) => {
    const requestBody = {
      location: payload.location,
      land_owned: payload.land_owned ?? true,
      grid_rows: payload.grid_rows ?? DEFAULT_GRID_ROWS,
      grid_cols: payload.grid_cols ?? DEFAULT_GRID_COLS,
      analysis_mode: payload.analysis_mode ?? "deep",
    };
    const useRealData = payload.use_real_data ?? useGridStore.getState().useRealData;

    set({
      isSearching: true,
      searchError: null,
      analysisStatus: "running",
      selectedClusterId: null,
      selectedCellId: null,
      analysisTarget: payload.location,
    });

    try {
      const response = await fetch(`${apiBaseUrl()}/api/v1/analyze?use_real_data=${useRealData}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = (await response.json()) as
        | AnalysisResult
        | {
            error?: string;
            message?: string;
          };

      if (!response.ok) {
        const message =
          "message" in data && typeof data.message === "string"
            ? data.message
            : "error" in data && typeof data.error === "string"
              ? data.error
              : "Analysis failed.";
        throw new Error(message);
      }

      const result = data as AnalysisResult;
      const center = { lat: result.location.lat, lng: result.location.lng };

      set({
        mapCenter: center,
        mapZoom: DEFAULT_ZOOM,
        currentRtoZone: result.rto_zone,
        gridCells: result.cells,
        analysisResult: result,
        analysisStatus: "complete",
        showChargers: result.chargers && result.chargers.length > 0 ? true : useGridStore.getState().showChargers,
        selectedCellId: null,
        selectedClusterId: null,
        isSearching: false,
        searchError: null,
        analysisTarget: null,
      });
    } catch (error) {
      set({
        isSearching: false,
        analysisStatus: "error",
        searchError: error instanceof Error ? error.message : "Analysis failed.",
        analysisTarget: null,
      });
    }
  },
  searchLocation: async (location) => {
    set({ isSearching: true, searchError: null });

    try {
      const payload =
        typeof location === "string"
          ? { location }
          : { lat: location.lat, lng: location.lng };

      const response = await fetch(`${apiBaseUrl()}/api/v1/geocode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as GeocodeResponse & {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data.message ?? data.error ?? "Location search failed.");
      }

      const center = { lat: data.lat, lng: data.lng };
      const gridCells = populateGridDemand(
        generateGrid(center.lat, center.lng, DEFAULT_GRID_ROWS, DEFAULT_GRID_COLS),
        data.rto_zone.total_evs
      );

      set({
        mapCenter: center,
        mapZoom: DEFAULT_ZOOM,
        currentRtoZone: data.rto_zone,
        gridCells,
        analysisResult: null,
        analysisStatus: "idle",
        selectedClusterId: null,
        selectedCellId: null,
        isSearching: false,
        searchError: null,
      });
    } catch (error) {
      set({
        isSearching: false,
        analysisStatus: "error",
        searchError: error instanceof Error ? error.message : "Location search failed.",
      });
    }
  },
}));
