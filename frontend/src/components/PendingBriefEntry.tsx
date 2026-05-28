import { formatTime, messageTitle } from "@/lib/format";
import type { IncomingMessage } from "@/types/message";

interface PendingBriefEntryProps {
  active: boolean;
  message: IncomingMessage;
}

export function PendingBriefEntry({ active, message }: PendingBriefEntryProps) {
  return (
    <article className="brief-entry pending">
      <div className="entry-main">
        <div className="entry-classification">
          <span className="classification-tag Pending">Pending</span>
        </div>
        <div className="entry-copy">
          <div className="entry-line">
            <span className="entry-time">{formatTime(message.timestamp)}</span>
            <strong>{messageTitle(message)}</strong>
          </div>
          <p>{active ? "Classifying in current batch..." : "Waiting for LLM triage..."}</p>
        </div>
      </div>

      <div className="entry-actions">
        <span className="row-spinner" aria-label="Processing" />
      </div>
    </article>
  );
}
