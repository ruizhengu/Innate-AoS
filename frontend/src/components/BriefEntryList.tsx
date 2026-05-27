import { BriefEntry } from "@/components/BriefEntry";
import type { TriageAnalysis, TriageCategory } from "@/types/message";

interface BriefEntryListProps {
  analyses: TriageAnalysis[];
  activeFilter: TriageCategory | "all";
  expandedId: number | null;
  onCopyDraft: (text: string) => Promise<void>;
  onToggleExpanded: (id: number) => void;
}

export function BriefEntryList({
  analyses,
  activeFilter,
  expandedId,
  onCopyDraft,
  onToggleExpanded,
}: BriefEntryListProps) {
  const visibleAnalyses = analyses.filter((item) => activeFilter === "all" || item.category === activeFilter);

  return (
    <section className="entry-list" aria-label="Triage entries">
      {visibleAnalyses.map((analysis) => (
        <BriefEntry
          key={analysis.id}
          analysis={analysis}
          expanded={analysis.id === expandedId}
          onCopyDraft={onCopyDraft}
          onToggleExpanded={onToggleExpanded}
        />
      ))}
    </section>
  );
}
