"use client";

import { FullChatView } from "@/components/chat/FullChatView";
import { MapCanvas } from "@/components/map/MapCanvas";
import { DeepDiveDrawer } from "@/components/panels/DeepDiveDrawer";
import { IntelligencePanel } from "@/components/panels/IntelligencePanel";
import { ReportView } from "@/components/panels/ReportView";
import { CommandBar } from "@/components/ui/CommandBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { useGridStore } from "@/store/gridStore";

export default function Home() {
  const activeView = useGridStore((state) => state.activeView);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[var(--bg-page)] text-[var(--text-primary)]">
      <CommandBar />
      <main className="relative h-[calc(100vh-56px)] w-full overflow-hidden">
        <section className={`relative h-full w-full ${activeView === "map" ? "block" : "hidden"}`}>
          <div className="h-full w-full md:pr-[320px]">
            <MapCanvas />
            <EmptyState />
          </div>
          <IntelligencePanel />
        </section>
        <section className={`h-full w-full ${activeView === "report" ? "block" : "hidden"}`}>
          <ReportView />
        </section>
        <section className={`h-full w-full ${activeView === "chat" ? "block" : "hidden"}`}>
          <FullChatView />
        </section>
      </main>
      {activeView === "map" ? <DeepDiveDrawer /> : null}
      <LoadingOverlay />
      <ErrorBanner />
    </div>
  );
}
