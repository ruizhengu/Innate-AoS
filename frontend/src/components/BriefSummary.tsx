import { buildBriefing } from "@/lib/briefing";
import type { TriageAnalysis } from "@/types/message";

interface BriefSummaryProps {
  analyses: TriageAnalysis[];
}

export function BriefSummary({ analyses }: BriefSummaryProps) {
  const highlights = buildBriefing(analyses).slice(0, 3);

  return (
    <section className="summary-strip" aria-label="Daily brief highlights">
      {highlights.map((line) => (
        <p key={line.label}>
          <strong>{line.label}</strong> {line.body}
        </p>
      ))}
    </section>
  );
}
