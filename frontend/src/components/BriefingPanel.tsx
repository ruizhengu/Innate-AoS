import { buildBriefing } from "@/lib/briefing";
import type { TriageAnalysis } from "@/types/message";

interface BriefingPanelProps {
  analyses: TriageAnalysis[];
}

export function BriefingPanel({ analyses }: BriefingPanelProps) {
  const briefing = buildBriefing(analyses);

  return (
    <section className="briefing">
      <div className="section-heading">
        <p className="eyebrow">Read time: under 2 minutes</p>
        <h2>CEO briefing</h2>
      </div>
      <div className="brief-text">
        {briefing.map((line) => (
          <p key={line.label}>
            <strong>{line.label}</strong> {line.body}
          </p>
        ))}
      </div>
    </section>
  );
}
