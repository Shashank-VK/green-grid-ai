import { useGridStore, type MapType } from "@/store/gridStore";

const MAP_TYPES: Array<{ label: string; value: MapType }> = [
  { label: "Satellite", value: "satellite" },
  { label: "Terrain", value: "terrain" },
  { label: "Roadmap", value: "roadmap" },
];

export function MapTypeToggle() {
  const mapType = useGridStore((state) => state.mapType);
  const setMapType = useGridStore((state) => state.setMapType);

  return (
    <div className="flex rounded-full border border-[var(--border-subtle)] bg-[rgba(14,13,12,0.72)] p-1">
      {MAP_TYPES.map((type) => {
        const isActive = mapType === type.value;

        return (
          <button
            key={type.value}
            type="button"
            onClick={() => setMapType(type.value)}
            className="relative min-w-20 px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-200 ease-out hover:text-[var(--text-primary)]"
          >
            <span className={isActive ? "text-[var(--text-primary)]" : undefined}>
              {type.label}
            </span>
            {isActive ? (
              <span className="absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-[var(--brand-primary)]" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
