import { formatTime, messageTitle } from "@/lib/format";
import type { TriageAnalysis } from "@/types/message";

interface BriefEntryProps {
  analysis: TriageAnalysis;
  expanded: boolean;
  onCopyDraft: (text: string) => Promise<void>;
  onToggleExpanded: (id: number) => void;
}

export function BriefEntry({ analysis, expanded, onCopyDraft, onToggleExpanded }: BriefEntryProps) {
  return (
    <article className={`brief-entry ${expanded ? "expanded" : ""}`}>
      <div className="entry-main">
        <span className={`classification-tag ${analysis.category}`}>{analysis.category}</span>
        <div className="entry-copy">
          <div className="entry-line">
            <span className="entry-time">{formatTime(analysis.timestamp)}</span>
            <strong>{messageTitle(analysis)}</strong>
          </div>
          <p>{analysis.reason}</p>
        </div>
      </div>

      <div className="entry-actions">
        <button className="entry-action primary" type="button" onClick={() => void onCopyDraft(analysis.draft)}>
          Draft Reply
        </button>
        <button className="entry-action" type="button" onClick={() => onToggleExpanded(analysis.id)}>
          {expanded ? "Hide Details" : "Details"}
        </button>
      </div>

      {expanded ? (
        <div className="entry-detail">
          <div>
            <span className="detail-label">Classification</span>
            <p>
              {analysis.category} | {analysis.confidence} confidence | Owner: {analysis.owner}
              {analysis.source === "backend" ? " | Z.AI triage" : " | fallback triage"}
            </p>
          </div>
          <div>
            <span className="detail-label">Why</span>
            <p>{analysis.reason}</p>
          </div>
          <div>
            <span className="detail-label">Evidence</span>
            <ul>
              {analysis.evidence.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <span className="detail-label">Draft Reply</span>
            <p>{analysis.draft}</p>
          </div>
          <div>
            <span className="detail-label">Original Sender</span>
            <p>{analysis.from}</p>
          </div>
          {analysis.flag ? (
            <div>
              <span className="detail-label">Flag</span>
              <p>{analysis.flag}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
