import { messageTitle } from "@/lib/format";
import type { TriageAnalysis } from "@/types/message";

interface DraftComposerProps {
  analysis: TriageAnalysis;
  draftText: string;
  regenerating: boolean;
  onChangeDraft: (value: string) => void;
  onClose: () => void;
  onRegenerate: () => Promise<void>;
  onSend: () => void;
}

export function DraftComposer({
  analysis,
  draftText,
  regenerating,
  onChangeDraft,
  onClose,
  onRegenerate,
  onSend,
}: DraftComposerProps) {
  return (
    <div className="draft-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        aria-label="Draft reply"
        className="draft-composer"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="draft-header">
          <div>
            <span className={`classification-tag ${analysis.category}`}>{analysis.category}</span>
            <h2>Draft Reply</h2>
            <p>{messageTitle(analysis)}</p>
          </div>
          <button className="icon-button" type="button" aria-label="Close draft" onClick={onClose}>
            x
          </button>
        </header>

        <div className="draft-meta">
          <div>
            <span className="detail-label">To</span>
            <p>{analysis.from}</p>
          </div>
          <div>
            <span className="detail-label">Why</span>
            <p>{analysis.reason}</p>
          </div>
        </div>

        <label className="draft-field">
          <span className="detail-label">Message</span>
          <div className="draft-textarea-wrap">
            <textarea
              disabled={regenerating}
              value={draftText}
              onChange={(event) => onChangeDraft(event.target.value)}
            />
            {regenerating ? (
              <div className="draft-loading" aria-live="polite">
                <span className="loading-dots">
                  <span />
                  <span />
                  <span />
                </span>
                Regenerating draft
              </div>
            ) : null}
          </div>
        </label>

        <footer className="draft-actions">
          <button className="entry-action" type="button" disabled={regenerating} onClick={() => void onRegenerate()}>
            Regenerate
          </button>
          <button className="entry-action primary" type="button" disabled={regenerating} onClick={onSend}>
            Send
          </button>
        </footer>
      </section>
    </div>
  );
}
