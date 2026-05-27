import { MessageCard } from "@/components/MessageCard";
import type { TriageAnalysis, TriageCategory } from "@/types/message";

const filters: Array<TriageCategory | "all"> = ["all", "Decide", "Delegate", "Ignore"];

interface MessageTabsProps {
  analyses: TriageAnalysis[];
  activeFilter: TriageCategory | "all";
  selectedId: number;
  onFilterChange: (filter: TriageCategory | "all") => void;
}

export function MessageTabs({ analyses, activeFilter, selectedId, onFilterChange }: MessageTabsProps) {
  const visibleAnalyses = analyses.filter((item) => activeFilter === "all" || item.category === activeFilter);

  return (
    <section className="detail-pane">
      <div className="tabs" role="tablist" aria-label="Message categories">
        {filters.map((filter) => (
          <button
            className={`tab ${activeFilter === filter ? "active" : ""}`}
            type="button"
            key={filter}
            onClick={() => onFilterChange(filter)}
          >
            {filter === "all" ? "All" : filter}
          </button>
        ))}
      </div>
      <div className="message-grid">
        {visibleAnalyses.map((item) => (
          <MessageCard key={item.id} analysis={item} selected={item.id === selectedId} />
        ))}
      </div>
    </section>
  );
}
