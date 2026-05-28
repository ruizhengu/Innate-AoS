import { BriefEntry } from "@/components/BriefEntry";
import { PendingBriefEntry } from "@/components/PendingBriefEntry";
import type {
  BriefFilter,
  IncomingMessage,
  MessageWorkflowState,
  TriageAnalysis,
} from "@/types/message";

interface BriefEntryListProps {
  analysesById: Map<number, TriageAnalysis>;
  activeFilter: BriefFilter;
  activeBatchIds: Set<number>;
  messages: IncomingMessage[];
  processing: boolean;
  workflowById: Map<number, MessageWorkflowState>;
  onArchive: (id: number) => void;
  onOpenDetails: (analysis: TriageAnalysis) => void;
  onOpenDraft: (analysis: TriageAnalysis) => void;
  onReopen: (id: number) => void;
}

export function BriefEntryList({
  analysesById,
  activeFilter,
  activeBatchIds,
  messages,
  processing,
  workflowById,
  onArchive,
  onOpenDetails,
  onOpenDraft,
  onReopen,
}: BriefEntryListProps) {
  const visibleItems = messages.filter((message) => {
    const analysis = analysesById.get(message.id);
    const archived = workflowById.get(message.id)?.archived;
    if (activeFilter === "archive") return archived;
    if (archived) return false;
    if (!analysis) return activeFilter === "all";
    return activeFilter === "all" || analysis.category === activeFilter;
  });

  return (
    <section className="entry-list" aria-label="Triage entries">
      {visibleItems.length ? visibleItems.map((message) => {
        const analysis = analysesById.get(message.id);
        if (!analysis) {
          return (
            <PendingBriefEntry
              key={message.id}
              message={message}
              active={activeBatchIds.has(message.id)}
            />
          );
        }

        return (
          <BriefEntry
            key={analysis.id}
            analysis={analysis}
            archived={Boolean(workflowById.get(analysis.id)?.archived)}
            completed={Boolean(workflowById.get(analysis.id)?.completed)}
            completedLabel={completedLabelFor(analysis, workflowById.get(analysis.id))}
            onArchive={onArchive}
            onOpenDetails={onOpenDetails}
            onOpenDraft={onOpenDraft}
            onReopen={onReopen}
          />
        );
      }) : (
        <article className="empty-state">
          <strong>{processing ? "Processing messages..." : "No messages loaded"}</strong>
          <p>{processing ? "Classified batches will appear here as soon as they complete." : "Use Load JSON to start triage."}</p>
        </article>
      )}
    </section>
  );
}

function completedLabelFor(analysis: TriageAnalysis, workflow?: MessageWorkflowState): string {
  if (analysis.category !== "Delegate") return "Completed";
  return workflow?.assignedTo ? `Sent to ${workflow.assignedTo}` : "Completed";
}
