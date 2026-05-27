"use client";

import { useMemo, useState } from "react";
import { BriefEntryList } from "@/components/BriefEntryList";
import { BriefFilters } from "@/components/BriefFilters";
import { BriefSummary } from "@/components/BriefSummary";
import { DailyBriefHeader } from "@/components/DailyBriefHeader";
import { DraftComposer } from "@/components/DraftComposer";
import { FlagsSection } from "@/components/FlagsSection";
import { MessageDetailModal } from "@/components/MessageDetailModal";
import { Toast } from "@/components/Toast";
import { regenerateDraft } from "@/lib/drafts";
import { analyzeMessages, countByCategory } from "@/lib/triage";
import type { BriefFilter, IncomingMessage, MessageWorkflowState, TriageAnalysis } from "@/types/message";

interface ExecutiveDashboardProps {
  initialMessages: IncomingMessage[];
}

export function ExecutiveDashboard({ initialMessages }: ExecutiveDashboardProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [activeFilter, setActiveFilter] = useState<BriefFilter>("all");
  const [activeDetails, setActiveDetails] = useState<TriageAnalysis | null>(null);
  const [activeDraft, setActiveDraft] = useState<TriageAnalysis | null>(null);
  const [workflowById, setWorkflowById] = useState<Map<number, MessageWorkflowState>>(() => new Map());
  const [draftAssignee, setDraftAssignee] = useState("Ben");
  const [draftText, setDraftText] = useState("");
  const [regeneratingDraft, setRegeneratingDraft] = useState(false);
  const [toast, setToast] = useState("");

  const analyses = useMemo(() => analyzeMessages(messages), [messages]);
  const activeAnalyses = useMemo(
    () => analyses.filter((analysis) => !workflowById.get(analysis.id)?.archived),
    [analyses, workflowById],
  );
  const counts = useMemo(() => countByCategory(activeAnalyses), [activeAnalyses]);
  const flags = analyses.filter((item) => item.flag);
  const archiveCount = useMemo(
    () => analyses.filter((analysis) => workflowById.get(analysis.id)?.archived).length,
    [analyses, workflowById],
  );

  function handleOpenDraft(analysis: TriageAnalysis) {
    setActiveDraft(analysis);
    setDraftAssignee(workflowById.get(analysis.id)?.assignedTo || "Ben");
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
    if (activeDraft) {
      updateWorkflow(activeDraft.id, {
        assignedTo: activeDraft.category === "Delegate" ? draftAssignee : undefined,
        completed: true,
      });
    }
    setActiveDraft(null);
    setDraftText("");
    setRegeneratingDraft(false);
    setToast(activeDraft?.category === "Delegate" ? `Handoff sent to ${draftAssignee}` : "Message sent");
  }

  function handleArchive(id: number) {
    updateWorkflow(id, { archived: true });
    setToast("Message archived");
  }

  function handleReopen(id: number) {
    updateWorkflow(id, { archived: false });
    setToast("Message reopened");
  }

  function updateWorkflow(id: number, nextState: MessageWorkflowState) {
    setWorkflowById((current) => {
      const next = new Map(current);
      next.set(id, { ...next.get(id), ...nextState });
      return next;
    });
  }

  async function handleUpload(file: File) {
    try {
      const parsed = JSON.parse(await file.text()) as IncomingMessage[];
      if (!Array.isArray(parsed)) throw new Error("Expected an array of messages");
      setMessages(parsed);
      setWorkflowById(new Map());
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
        <FlagsSection />
        <BriefFilters
          activeFilter={activeFilter}
          archiveCount={archiveCount}
          counts={counts}
          total={activeAnalyses.length}
          onFilterChange={setActiveFilter}
        />
        <BriefEntryList
          analyses={analyses}
          activeFilter={activeFilter}
          workflowById={workflowById}
          onArchive={handleArchive}
          onOpenDetails={setActiveDetails}
          onOpenDraft={handleOpenDraft}
          onReopen={handleReopen}
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
          assignee={draftAssignee}
          draftText={draftText}
          regenerating={regeneratingDraft}
          onChangeAssignee={setDraftAssignee}
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
