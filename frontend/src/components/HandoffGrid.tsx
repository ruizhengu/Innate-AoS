import { messageTitle } from "@/lib/format";
import type { TriageAnalysis } from "@/types/message";

interface HandoffGridProps {
  analyses: TriageAnalysis[];
  onCopy: (text: string) => Promise<void>;
}

export function HandoffGrid({ analyses, onCopy }: HandoffGridProps) {
  const handoffs = analyses.filter((item) => item.category === "Delegate");

  return (
    <section className="handoff-section">
      <div className="section-heading">
        <p className="eyebrow">Ready to forward</p>
        <h2>Delegation handoffs</h2>
      </div>
      <div className="handoff-grid">
        {handoffs.map((item) => (
          <article className="handoff-card" key={item.id}>
            <div className="card-meta">
              <span>{item.owner}</span>
              <span>#{item.id}</span>
            </div>
            <h3>{messageTitle(item)}</h3>
            <p>{item.reason}</p>
            <div className="draft">{item.draft}</div>
            <button className="copy-card" type="button" onClick={() => void onCopy(item.draft)}>
              Copy handoff
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
