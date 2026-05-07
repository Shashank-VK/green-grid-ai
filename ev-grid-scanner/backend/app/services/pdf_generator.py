from __future__ import annotations

from datetime import datetime
from io import BytesIO
from pathlib import Path
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Image, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


class PDFGenerator:
  def __init__(self):
    self.styles = getSampleStyleSheet()
    self.styles.add(
      ParagraphStyle(
        name="CustomTitle",
        fontSize=24,
        textColor=colors.HexColor("#D97757"),
        spaceAfter=20,
        alignment=1,
      )
    )
    self.styles.add(
      ParagraphStyle(
        name="SectionHeader",
        fontSize=16,
        textColor=colors.HexColor("#D97757"),
        spaceAfter=12,
        spaceBefore=12,
      )
    )

  def generate(self, analysis_data: dict[str, Any], map_image_path: str | None = None) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.5 * inch, bottomMargin=0.5 * inch)
    story: list[Any] = []

    story.append(Paragraph("greengrid Viability Report", self.styles["CustomTitle"]))
    story.append(Paragraph(f"Location: {analysis_data['location']['name']}", self.styles["Heading2"]))
    story.append(
      Paragraph(
        f"RTO Zone: {analysis_data['rto_zone']['code']} - {analysis_data['rto_zone']['name']}",
        self.styles["Normal"],
      )
    )
    story.append(Paragraph(f"Date: {datetime.now().strftime('%Y-%m-%d')}", self.styles["Normal"]))
    story.append(Spacer(1, 0.3 * inch))

    story.append(Paragraph("Executive Summary", self.styles["SectionHeader"]))
    best_cluster = analysis_data.get("top_clusters", [None])[0] if analysis_data.get("top_clusters") else None
    if best_cluster:
      story.append(
        Paragraph(
          f"Best Cluster: {', '.join(best_cluster['cell_ids'])} (Avg Score: {best_cluster['avg_score']})",
          self.styles["Normal"],
        )
      )
      rec = best_cluster.get("charger_recommendation", {})
      story.append(Paragraph(f"Recommended: {rec.get('label', 'Review required')}", self.styles["Normal"]))
    story.append(Spacer(1, 0.2 * inch))

    if map_image_path and Path(map_image_path).exists():
      story.append(Image(map_image_path, width=6 * inch, height=4 * inch))
      story.append(Spacer(1, 0.2 * inch))

    story.append(Paragraph("Score Breakdown", self.styles["SectionHeader"]))
    score_data = [["Cell", "Final", "Demand", "Infra", "Grid", "Comm", "Access", "Risk"]]
    top_cells = sorted(analysis_data.get("cells", []), key=lambda cell: cell.get("final_score", 0), reverse=True)[:20]
    for cell in top_cells:
      scores = cell.get("scores", {})
      score_data.append(
        [
          cell.get("id", ""),
          cell.get("final_score", 0),
          scores.get("s1_demand", 0),
          scores.get("s2_infra_gap", 0),
          scores.get("s3_grid_ready", 0),
          scores.get("s4_commercial", 0),
          scores.get("s5_strategic", 0),
          scores.get("s6_env_risk", 0),
        ]
      )

    table = Table(score_data, colWidths=[0.6 * inch, 0.6 * inch] + [0.7 * inch] * 6)
    table.setStyle(
      TableStyle(
        [
          ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1A1815")),
          ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#F5F0E8")),
          ("ALIGN", (0, 0), (-1, -1), "CENTER"),
          ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
          ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#F7F1EA")),
          ("TEXTCOLOR", (0, 1), (-1, -1), colors.HexColor("#252220")),
          ("GRID", (0, 0), (-1, -1), 1, colors.HexColor("#2E2B27")),
        ]
      )
    )
    story.append(table)

    if analysis_data.get("top_clusters"):
      story.append(PageBreak())
      story.append(Paragraph("Top Clusters", self.styles["SectionHeader"]))
      for index, cluster in enumerate(analysis_data["top_clusters"][:3], 1):
        story.append(
          Paragraph(
            f"Cluster {index}: Cells {', '.join(cluster['cell_ids'])} - Avg Score {cluster['avg_score']}",
            self.styles["Normal"],
          )
        )
        if "cost_estimate" in cluster:
          cost = cluster["cost_estimate"]
          story.append(
            Paragraph(f"Cost: Rs {cost['total_min']:,} - Rs {cost['total_max']:,}", self.styles["Normal"])
          )
        if "timeline" in cluster:
          timeline = cluster["timeline"]
          story.append(
            Paragraph(
              f"Timeline: {timeline['total_weeks']} weeks ({timeline['total_months']} months)",
              self.styles["Normal"],
            )
          )
        story.append(Spacer(1, 0.1 * inch))

    if analysis_data.get("growth_projection"):
      story.append(Paragraph("Future Growth", self.styles["SectionHeader"]))
      growth_projection = analysis_data["growth_projection"]
      for year, value in growth_projection.get("projected", {}).items():
        story.append(Paragraph(f"{year}: ~{value:,} EVs", self.styles["Normal"]))

    story.append(Spacer(1, 0.3 * inch))
    story.append(
      Paragraph(
        "Disclaimer: Estimates only. Verify with BESCOM and licensed contractors before proceeding.",
        self.styles["Normal"],
      )
    )

    doc.build(story)
    buffer.seek(0)
    return buffer.read()
