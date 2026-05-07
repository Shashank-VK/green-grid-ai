import type { GridCell } from "@/lib/gridMath";

export function getScoreColor(score: number): string {
  if (score >= 8) {
    return "#C0392B";
  }
  if (score >= 6) {
    return "#B45309";
  }
  if (score >= 4) {
    return "#166534";
  }
  return "#6B7280";
}

export function getScoreFill(score: number): string {
  if (score >= 8) {
    return "rgba(192, 57, 43, 0.25)";
  }
  if (score >= 6) {
    return "rgba(180, 83, 9, 0.25)";
  }
  if (score >= 4) {
    return "rgba(22, 101, 52, 0.25)";
  }
  return "rgba(107, 114, 128, 0.25)";
}

export function getScoreBackground(score: number): string {
  if (score >= 8) return "#FEF2F2";
  if (score >= 6) return "#FFF7ED";
  if (score >= 4) return "#F0FDF4";
  return "#F9FAFB";
}

export function isSevereFloodCell(cell: GridCell): boolean {
  return Boolean(cell.flood_risk?.bbmp_severe);
}

export function scoreToVerdict(score: number): string {
  if (score >= 8) {
    return "HIGH PRIORITY";
  }
  if (score >= 6) {
    return "VIABLE";
  }
  if (score >= 4) {
    return "MARGINAL";
  }
  return "NOT RECOMMENDED";
}

export function hexToRgba(hex: string, alpha: number): string {
  const sanitized = hex.replace("#", "");
  const fullHex = sanitized.length === 3 ? sanitized.split("").map((char) => `${char}${char}`).join("") : sanitized;

  const value = Number.parseInt(fullHex, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
