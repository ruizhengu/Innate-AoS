"use client";

import { useMemo, useState } from "react";
import { BriefingPanel } from "@/components/BriefingPanel";
import { DecisionRail } from "@/components/DecisionRail";
import { HandoffGrid } from "@/components/HandoffGrid";
import { MessageTabs } from "@/components/MessageTabs";
import { SignalMap } from "@/components/SignalMap";
import { SummaryMetrics } from "@/components/SummaryMetrics";
import { Toast } from "@/components/Toast";
import { buildPlainTextBrief } from "@/lib/briefing";
import { copyText } from "@/lib/clipboard";
import { analyzeMessages, countByCategory } from "@/lib/triage";
import type { IncomingMessage, TriageCategory } from "@/types/message";

interface ExecutiveDashboardProps {
  initialMessages: IncomingMessage[];
}

export function ExecutiveDashboard({ initialMessages }: ExecutiveDashboardProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [activeFilter, setActiveFilter] = useState<TriageCategory | "all">("all");
  const [selectedId, setSelectedId] = useState(16);
  const [toast, setToast] = useState("");

  const analyses = useMemo(() => analyzeMessages(messages), [messages]);
  const counts = useMemo(() => countByCategory(analyses), [analyses]);
  const flags = analyses.filter((item) => item.flag);

  async function handleCopyBrief() {
    await copyWithToast(buildPlainTextBrief(analyses), "Brief copied");
  }

  async function handleCopyHandoff(text: string) {
    await copyWithToast(text, "Handoff copied");
  }

  async function copyWithToast(text: string, successMessage: string) {
    try {
      await copyText(text);
      setToast(successMessage);
    } catch {
      setToast("Clipboard unavailable");
    }
  }

  async function handleUpload(file: File) {
    try {
      const parsed = JSON.parse(await file.text()) as IncomingMessage[];
      if (!Array.isArray(parsed)) throw new Error("Expected an array of messages");
      const nextAnalyses = analyzeMessages(parsed);
      setMessages(parsed);
      setActiveFilter("all");
      setSelectedId(nextAnalyses.find((item) => item.category === "Decide")?.id || nextAnalyses[0]?.id || 0);
      setToast("New message set analyzed");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not load JSON");
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">AI Chief of Staff</p>
          <h1>Morning command brief</h1>
        </div>
        <div className="top-actions">
          <label className="upload-button" title="Load a new messages.json file">
            <input
              type="file"
              accept=".json,application/json"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleUpload(file);
                event.target.value = "";
              }}
            />
            <span>Load JSON</span>
          </label>
          <button className="primary-action" type="button" onClick={() => void handleCopyBrief()}>
            Copy brief
          </button>
        </div>
      </header>

      <main>
        <section className="hero-panel">
          <BriefingPanel analyses={analyses} />
          <SignalMap analyses={analyses} decisionCount={counts.Decide} />
        </section>

        <SummaryMetrics counts={counts} flagCount={flags.length} />

        <section className="workbench">
          <DecisionRail analyses={analyses} selectedId={selectedId} onSelect={setSelectedId} />
          <MessageTabs
            analyses={analyses}
            activeFilter={activeFilter}
            selectedId={selectedId}
            onFilterChange={setActiveFilter}
          />
        </section>

        <HandoffGrid analyses={analyses} onCopy={handleCopyHandoff} />
      </main>

      <Toast message={toast} onDone={() => setToast("")} />
    </div>
  );
}
