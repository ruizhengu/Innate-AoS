import { BriefEntry } from "@/components/BriefEntry";
import type { TriageAnalysis, TriageCategory } from "@/types/message";

interface BriefEntryListProps {
  analyses: TriageAnalysis[];
  activeFilter: TriageCategory | "all";
  onOpenDetails: (analysis: TriageAnalysis) => void;
  onOpenDraft: (analysis: TriageAnalysis) => void;
}

export function BriefEntryList({
  analyses,
  activeFilter,
  onOpenDetails,
  onOpenDraft,
}: BriefEntryListProps) {
  const visibleAnalyses = analyses.filter((item) => activeFilter === "all" || item.category === activeFilter);

  return (
    <section className="entry-list" aria-label="Triage entries">
      {visibleAnalyses.map((analysis) => (
        <BriefEntry
          key={analysis.id}
          analysis={analysis}
          onOpenDetails={onOpenDetails}
          onOpenDraft={onOpenDraft}
        />
      ))}
    </section>
  );
}
