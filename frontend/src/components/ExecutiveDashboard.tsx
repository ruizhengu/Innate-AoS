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
import { generateDailyBriefing, streamTriage } from "@/lib/api";
import { analysisFromBackendResult, countByCategory } from "@/lib/triage";
import type {
  BackendTriageResult,
  BriefFilter,
  DailyBriefing,
  IncomingMessage,
  MessageWorkflowState,
  TriageAnalysis,
} from "@/types/message";

interface ExecutiveDashboardProps {
  initialMessages: IncomingMessage[];
}

export function ExecutiveDashboard({ initialMessages }: ExecutiveDashboardProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [activeFilter, setActiveFilter] = useState<BriefFilter>("all");
  const [activeDetails, setActiveDetails] = useState<TriageAnalysis | null>(null);
  const [activeDraft, setActiveDraft] = useState<TriageAnalysis | null>(null);
  const [analysesById, setAnalysesById] = useState<Map<number, TriageAnalysis>>(() => new Map());
  const [dailyBriefing, setDailyBriefing] = useState<DailyBriefing | null>(null);
  const [workflowById, setWorkflowById] = useState<Map<number, MessageWorkflowState>>(() => new Map());
  const [draftAssignee, setDraftAssignee] = useState("Ben");
  const [draftText, setDraftText] = useState("");
  const [processingBriefing, setProcessingBriefing] = useState(false);
  const [processingMessages, setProcessingMessages] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [activeBatchIds, setActiveBatchIds] = useState<Set<number>>(() => new Set());
  const [regeneratingDraft, setRegeneratingDraft] = useState(false);
  const [toast, setToast] = useState("");

  const analyses = useMemo(() => messages.flatMap((message) => {
    const analysis = analysesById.get(message.id);
    return analysis ? [analysis] : [];
  }), [analysesById, messages]);
  const activeAnalyses = useMemo(
    () => analyses.filter((analysis) => !workflowById.get(analysis.id)?.archived),
    [analyses, workflowById],
  );
  const counts = useMemo(() => countByCategory(activeAnalyses), [activeAnalyses]);
  const flagCount = dailyBriefing?.flags.length || 0;
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
      setAnalysesById(new Map());
      setDailyBriefing(null);
      setWorkflowById(new Map());
      setActiveFilter("all");
      setActiveDetails(null);
      setActiveDraft(null);
      setProcessedCount(0);
      setActiveBatchIds(new Set());
      setProcessingBriefing(false);
      setProcessingMessages(true);
      setToast("Processing messages...");

      const results = await streamTriage(parsed, (event) => {
        if (event.type === "batch_started") {
          setActiveBatchIds(new Set(event.message_ids));
        } else if (event.type === "batch_completed") {
          applyBatchResults(parsed, event.results);
          setProcessedCount((current) => current + event.results.length);
          setActiveBatchIds(new Set());
        } else if (event.type === "completed") {
          setActiveBatchIds(new Set());
        }
      });

      applyBatchResults(parsed, results);
      setProcessedCount(results.length);
      setProcessingMessages(false);
      setActiveBatchIds(new Set());
      setProcessingBriefing(true);
      setToast("Generating daily briefing...");

      const briefing = await generateDailyBriefing(parsed, results);
      setDailyBriefing(briefing);
      setProcessingBriefing(false);
      setToast("Daily briefing ready");
    } catch (error) {
      setProcessingMessages(false);
      setProcessingBriefing(false);
      setActiveBatchIds(new Set());
      setToast(error instanceof Error ? error.message : "Could not load JSON");
    }
  }

  function applyBatchResults(messagesToAnalyze: IncomingMessage[], results: BackendTriageResult[]) {
    const messageById = new Map(messagesToAnalyze.map((message) => [message.id, message]));
    setAnalysesById((current) => {
      const next = new Map(current);
      for (const result of results) {
        const message = messageById.get(result.message_id);
        if (message) next.set(message.id, analysisFromBackendResult(message, result));
      }
      return next;
    });
  }

  return (
    <div className="app-shell">
      <DailyBriefHeader
        counts={counts}
        flagCount={flagCount}
        onUpload={(file) => void handleUpload(file)}
      />

      <main>
        <BriefSummary briefing={dailyBriefing} loading={processingMessages || processingBriefing} />
        <FlagsSection briefing={dailyBriefing} loading={processingMessages || processingBriefing} />
        {processingMessages ? (
          <div className="processing-strip">
            <span className="row-spinner" />
            <p>Processed {processedCount} / {messages.length} messages. Completed batches are available below.</p>
          </div>
        ) : null}
        <BriefFilters
          activeFilter={activeFilter}
          archiveCount={archiveCount}
          counts={counts}
          total={messages.length}
          onFilterChange={setActiveFilter}
        />
        <BriefEntryList
          analysesById={analysesById}
          activeFilter={activeFilter}
          activeBatchIds={activeBatchIds}
          messages={messages}
          processing={processingMessages}
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
