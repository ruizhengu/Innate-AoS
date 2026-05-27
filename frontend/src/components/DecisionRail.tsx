import { formatTime, messageTitle } from "@/lib/format";
import type { TriageAnalysis } from "@/types/message";

interface DecisionRailProps {
  analyses: TriageAnalysis[];
  selectedId: number;
  onSelect: (id: number) => void;
}

export function DecisionRail({ analyses, selectedId, onSelect }: DecisionRailProps) {
  const decisions = analyses.filter((item) => item.category === "Decide");

  return (
    <aside className="rail">
      <div className="section-heading compact">
        <p className="eyebrow">Priority lane</p>
        <h2>Needs the CEO</h2>
      </div>
      <div className="decision-list">
        {decisions.map((item) => (
          <button
            className={`decision-item ${item.id === selectedId ? "active" : ""}`}
            type="button"
            key={item.id}
            onClick={() => onSelect(item.id)}
          >
            <div className="decision-meta">
              <span>{formatTime(item.timestamp)}</span>
              <span>{item.confidence}</span>
            </div>
            <h3>{messageTitle(item)}</h3>
            <p>{item.reason}</p>
          </button>
        ))}
      </div>
    </aside>
  );
}
