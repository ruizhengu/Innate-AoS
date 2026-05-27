import { formatTime, messageTitle } from "@/lib/format";
import type { TriageAnalysis } from "@/types/message";

interface MessageCardProps {
  analysis: TriageAnalysis;
  selected: boolean;
}

export function MessageCard({ analysis, selected }: MessageCardProps) {
  return (
    <article className={`message-card ${selected ? "selected" : ""}`}>
      <div className="card-meta">
        <span>
          {formatTime(analysis.timestamp)} / {analysis.from || "Unknown"}
        </span>
        <span>#{analysis.id}</span>
      </div>
      <h3>{messageTitle(analysis)}</h3>
      <p className="message-body">{analysis.body}</p>
      <div className="badge-row">
        <span className={`badge ${analysis.category}`}>{analysis.category}</span>
        <span className="badge channel">{analysis.channel || "message"}</span>
        <span className="badge">{analysis.confidence} confidence</span>
      </div>
      <p>{analysis.reason}</p>
      <ul className="evidence">
        {analysis.evidence.map((evidence) => (
          <li key={evidence}>&quot;{evidence}&quot;</li>
        ))}
      </ul>
      <div className="draft">
        <strong>Draft:</strong> {analysis.draft}
      </div>
    </article>
  );
}
