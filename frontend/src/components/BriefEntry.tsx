import { formatTime, messageTitle } from "@/lib/format";
import type { TriageAnalysis } from "@/types/message";

interface BriefEntryProps {
  analysis: TriageAnalysis;
  archived: boolean;
  completed: boolean;
  completedLabel?: string;
  onArchive: (id: number) => void;
  onOpenDetails: (analysis: TriageAnalysis) => void;
  onOpenDraft: (analysis: TriageAnalysis) => void;
  onReopen: (id: number) => void;
}

export function BriefEntry({
  analysis,
  archived,
  completed,
  completedLabel,
  onArchive,
  onOpenDetails,
  onOpenDraft,
  onReopen,
}: BriefEntryProps) {
  return (
    <article className={`brief-entry ${completed ? "completed" : ""} ${archived ? "archived" : ""}`}>
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
            {completed ? <span className="completion-badge">{completedLabel || "Completed"}</span> : null}
          </div>
          <p>{analysis.reason}</p>
        </div>
      </div>

      <div className="entry-actions">
        {archived ? (
          <button className="entry-action primary" type="button" onClick={() => onReopen(analysis.id)}>
            Reopen
          </button>
        ) : completed || analysis.category === "Ignore" ? (
          <button className="entry-action primary" type="button" onClick={() => onArchive(analysis.id)}>
            Archive
          </button>
        ) : (
          <button className="entry-action primary" type="button" onClick={() => onOpenDraft(analysis)}>
            Draft Reply
          </button>
        )}
      </div>
    </article>
  );
}
