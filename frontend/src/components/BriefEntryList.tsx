import { BriefEntry } from "@/components/BriefEntry";
import type { BriefFilter, MessageWorkflowState, TriageAnalysis } from "@/types/message";

interface BriefEntryListProps {
  analyses: TriageAnalysis[];
  activeFilter: BriefFilter;
  workflowById: Map<number, MessageWorkflowState>;
  onArchive: (id: number) => void;
  onOpenDetails: (analysis: TriageAnalysis) => void;
  onOpenDraft: (analysis: TriageAnalysis) => void;
  onReopen: (id: number) => void;
}

export function BriefEntryList({
  analyses,
  activeFilter,
  workflowById,
  onArchive,
  onOpenDetails,
  onOpenDraft,
  onReopen,
}: BriefEntryListProps) {
  const visibleAnalyses = analyses.filter((item) => {
    const archived = workflowById.get(item.id)?.archived;
    if (activeFilter === "archive") return archived;
    if (archived) return false;
    return activeFilter === "all" || item.category === activeFilter;
  });

  return (
    <section className="entry-list" aria-label="Triage entries">
      {visibleAnalyses.map((analysis) => (
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
      ))}
    </section>
  );
}

function completedLabelFor(analysis: TriageAnalysis, workflow?: MessageWorkflowState): string {
  if (analysis.category !== "Delegate") return "Completed";
  return workflow?.assignedTo ? `Sent to ${workflow.assignedTo}` : "Completed";
}
