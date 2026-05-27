import { formatTime, messageTitle } from "@/lib/format";
import type { TriageAnalysis } from "@/types/message";

interface BriefEntryProps {
  analysis: TriageAnalysis;
  onOpenDetails: (analysis: TriageAnalysis) => void;
  onOpenDraft: (analysis: TriageAnalysis) => void;
}

export function BriefEntry({ analysis, onOpenDetails, onOpenDraft }: BriefEntryProps) {
  return (
    <article className="brief-entry">
      <div className="entry-main">
        <div className="entry-classification">
          <span className={`classification-tag ${analysis.category}`}>{analysis.category}</span>
          <button className="tag-detail-button" type="button" onClick={() => onOpenDetails(analysis)}>
            Details
          </button>
        </div>
        <div className="entry-copy">
          <div className="entry-line">
            <span className="entry-time">{formatTime(analysis.timestamp)}</span>
            <strong>{messageTitle(analysis)}</strong>
          </div>
          <p>{analysis.reason}</p>
        </div>
      </div>

      <div className="entry-actions">
        <button className="entry-action primary" type="button" onClick={() => onOpenDraft(analysis)}>
          Draft Reply
        </button>
      </div>
    </article>
  );
}
