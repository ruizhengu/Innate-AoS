import type { CategoryCounts, TriageCategory } from "@/types/message";

const filters: Array<TriageCategory | "all"> = ["all", "Decide", "Delegate", "Ignore"];

interface BriefFiltersProps {
  activeFilter: TriageCategory | "all";
  counts: CategoryCounts;
  total: number;
  onFilterChange: (filter: TriageCategory | "all") => void;
}

export function BriefFilters({ activeFilter, counts, total, onFilterChange }: BriefFiltersProps) {
  return (
    <nav className="brief-filters" aria-label="Message filters">
      {filters.map((filter) => (
        <button
          className={`filter-pill ${activeFilter === filter ? "active" : ""}`}
          type="button"
          key={filter}
          onClick={() => onFilterChange(filter)}
        >
          <span>{filter === "all" ? "All" : filter}</span>
          <strong>{filter === "all" ? total : counts[filter]}</strong>
        </button>
      ))}
    </nav>
  );
}
