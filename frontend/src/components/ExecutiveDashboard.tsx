"use client";

import { useMemo, useState } from "react";
import { BriefEntryList } from "@/components/BriefEntryList";
import { BriefFilters } from "@/components/BriefFilters";
import { BriefSummary } from "@/components/BriefSummary";
import { DailyBriefHeader } from "@/components/DailyBriefHeader";
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
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [toast, setToast] = useState("");

  const analyses = useMemo(() => analyzeMessages(messages), [messages]);
  const counts = useMemo(() => countByCategory(analyses), [analyses]);
  const flags = analyses.filter((item) => item.flag);

  async function handleCopyBrief() {
    await copyWithToast(buildPlainTextBrief(analyses), "Brief copied");
  }

  async function handleCopyDraft(text: string) {
    await copyWithToast(text || "No response needed.", "Draft reply copied");
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
      setMessages(parsed);
      setActiveFilter("all");
      setExpandedId(null);
      setToast("New message set analyzed with available backend results");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not load JSON");
    }
  }

  function handleToggleExpanded(id: number) {
    setExpandedId((currentId) => (currentId === id ? null : id));
  }

  return (
    <div className="app-shell">
      <DailyBriefHeader
        counts={counts}
        flagCount={flags.length}
        onCopyBrief={() => void handleCopyBrief()}
        onUpload={(file) => void handleUpload(file)}
      />

      <main>
        <BriefSummary analyses={analyses} />
        <BriefFilters activeFilter={activeFilter} counts={counts} total={analyses.length} onFilterChange={setActiveFilter} />
        <BriefEntryList
          analyses={analyses}
          activeFilter={activeFilter}
          expandedId={expandedId}
          onCopyDraft={handleCopyDraft}
          onToggleExpanded={handleToggleExpanded}
        />
      </main>

      <Toast message={toast} onDone={() => setToast("")} />
    </div>
  );
}
