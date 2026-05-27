import { messageTitle } from "@/lib/format";
import type { TriageAnalysis } from "@/types/message";

interface DraftComposerProps {
  analysis: TriageAnalysis;
  assignee: string;
  draftText: string;
  regenerating: boolean;
  onChangeAssignee: (value: string) => void;
  onChangeDraft: (value: string) => void;
  onClose: () => void;
  onRegenerate: () => Promise<void>;
  onSend: () => void;
}

const delegateAssignees = ["Ben", "Sam", "José"];

export function DraftComposer({
  analysis,
  assignee,
  draftText,
  regenerating,
  onChangeAssignee,
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
          {analysis.category === "Delegate" ? (
            <label className="assignee-field">
              <span className="detail-label">Assign to</span>
              <select
                disabled={regenerating}
                value={assignee}
                onChange={(event) => onChangeAssignee(event.target.value)}
              >
                {delegateAssignees.map((person) => (
                  <option key={person} value={person}>
                    {person}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div>
              <span className="detail-label">To</span>
              <p>{analysis.from}</p>
            </div>
          )}
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
            {analysis.category === "Delegate" ? "Send Handoff" : "Send"}
          </button>
        </footer>
      </section>
    </div>
  );
}
