"use client";

import { useMemo, useState } from "react";
import { BriefEntryList } from "@/components/BriefEntryList";
import { BriefFilters } from "@/components/BriefFilters";
import { BriefSummary } from "@/components/BriefSummary";
import { DailyBriefHeader } from "@/components/DailyBriefHeader";
import { DraftComposer } from "@/components/DraftComposer";
import { MessageDetailModal } from "@/components/MessageDetailModal";
import { Toast } from "@/components/Toast";
import { regenerateDraft } from "@/lib/drafts";
import { analyzeMessages, countByCategory } from "@/lib/triage";
import type { IncomingMessage, TriageAnalysis, TriageCategory } from "@/types/message";

interface ExecutiveDashboardProps {
  initialMessages: IncomingMessage[];
}

export function ExecutiveDashboard({ initialMessages }: ExecutiveDashboardProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [activeFilter, setActiveFilter] = useState<TriageCategory | "all">("all");
  const [activeDetails, setActiveDetails] = useState<TriageAnalysis | null>(null);
  const [activeDraft, setActiveDraft] = useState<TriageAnalysis | null>(null);
  const [draftText, setDraftText] = useState("");
  const [regeneratingDraft, setRegeneratingDraft] = useState(false);
  const [toast, setToast] = useState("");

  const analyses = useMemo(() => analyzeMessages(messages), [messages]);
  const counts = useMemo(() => countByCategory(analyses), [analyses]);
  const flags = analyses.filter((item) => item.flag);

  function handleOpenDraft(analysis: TriageAnalysis) {
    setActiveDraft(analysis);
    setDraftText(analysis.draft || "No response needed.");
    setRegeneratingDraft(false);
  }

  async function handleRegenerateDraft() {
    if (!activeDraft) return;
    setRegeneratingDraft(true);
    try {
      const nextDraft = await regenerateDraft(activeDraft, draftText);
      setDraftText(nextDraft);
      setToast("Draft regenerated");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not regenerate draft");
    } finally {
      setRegeneratingDraft(false);
    }
  }

  function handleSendDraft() {
    setActiveDraft(null);
    setDraftText("");
    setRegeneratingDraft(false);
    setToast("Message sent");
  }

  async function handleUpload(file: File) {
    try {
      const parsed = JSON.parse(await file.text()) as IncomingMessage[];
      if (!Array.isArray(parsed)) throw new Error("Expected an array of messages");
      setMessages(parsed);
      setActiveFilter("all");
      setToast("New message set analyzed with available backend results");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not load JSON");
    }
  }

  return (
    <div className="app-shell">
      <DailyBriefHeader
        counts={counts}
        flagCount={flags.length}
        onUpload={(file) => void handleUpload(file)}
      />

      <main>
        <BriefSummary />
        <BriefFilters activeFilter={activeFilter} counts={counts} total={analyses.length} onFilterChange={setActiveFilter} />
        <BriefEntryList
          analyses={analyses}
          activeFilter={activeFilter}
          onOpenDetails={setActiveDetails}
          onOpenDraft={handleOpenDraft}
        />
      </main>

      {activeDetails ? (
        <MessageDetailModal
          analysis={activeDetails}
          onClose={() => setActiveDetails(null)}
          onOpenDraft={handleOpenDraft}
        />
      ) : null}

      {activeDraft ? (
        <DraftComposer
          analysis={activeDraft}
          draftText={draftText}
          regenerating={regeneratingDraft}
          onChangeDraft={setDraftText}
          onClose={() => setActiveDraft(null)}
          onRegenerate={handleRegenerateDraft}
          onSend={handleSendDraft}
        />
      ) : null}

      <Toast message={toast} onDone={() => setToast("")} />
    </div>
  );
}
