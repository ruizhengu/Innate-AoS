import { formatTime, messageTitle } from "@/lib/format";
import type { TriageAnalysis } from "@/types/message";

interface MessageDetailModalProps {
  analysis: TriageAnalysis;
  onClose: () => void;
  onOpenDraft: (analysis: TriageAnalysis) => void;
}

export function MessageDetailModal({ analysis, onClose, onOpenDraft }: MessageDetailModalProps) {
  return (
    <div className="message-detail-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        aria-label="Message details"
        aria-modal="true"
        className="message-detail-modal"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="message-detail-header">
          <div>
            <span className={`classification-tag ${analysis.category}`}>{analysis.category}</span>
            <h2>{messageTitle(analysis)}</h2>
            <p>
              {formatTime(analysis.timestamp)} / {analysis.from}
            </p>
          </div>
          <button className="icon-button" type="button" aria-label="Close message details" onClick={onClose}>
            x
          </button>
        </header>

        <div className="message-detail-content">
          <section className="modal-section">
            <span className="detail-label">Reason</span>
            <p>{analysis.reason}</p>
          </section>

          <section className="modal-section">
            <span className="detail-label">Classification</span>
            <p>
              {analysis.category} / {analysis.confidence} confidence / Owner: {analysis.owner}
              {analysis.source === "backend" ? " / Z.AI triage" : " / fallback triage"}
            </p>
          </section>

          <section className="modal-section">
            <span className="detail-label">Evidence</span>
            <ul>
              {analysis.evidence.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          {analysis.flag ? (
            <section className="modal-section">
              <span className="detail-label">Flag</span>
              <p>{analysis.flag}</p>
            </section>
          ) : null}

          <section className="modal-section">
            <span className="detail-label">Original message</span>
            <p className="original-message">{analysis.body}</p>
          </section>
        </div>

        <footer className="message-detail-actions">
          <button className="entry-action" type="button" onClick={onClose}>
            Close
          </button>
          <button
            className="entry-action primary"
            type="button"
            onClick={() => {
              onClose();
              onOpenDraft(analysis);
            }}
          >
            Draft Reply
          </button>
        </footer>
      </section>
    </div>
  );
}
