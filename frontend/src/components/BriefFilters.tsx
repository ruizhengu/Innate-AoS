import type { BriefFilter, CategoryCounts } from "@/types/message";

const filters: BriefFilter[] = ["all", "Decide", "Delegate", "Ignore", "archive"];

interface BriefFiltersProps {
  activeFilter: BriefFilter;
  archiveCount: number;
  counts: CategoryCounts;
  total: number;
  onFilterChange: (filter: BriefFilter) => void;
}

export function BriefFilters({ activeFilter, archiveCount, counts, total, onFilterChange }: BriefFiltersProps) {
  return (
    <nav className="brief-filters" aria-label="Message filters">
      {filters.map((filter) => (
        <button
          className={`filter-pill ${activeFilter === filter ? "active" : ""}`}
          type="button"
          key={filter}
          onClick={() => onFilterChange(filter)}
        >
          <span>{labelForFilter(filter)}</span>
          <strong>{countForFilter(filter, total, counts, archiveCount)}</strong>
        </button>
      ))}
    </nav>
  );
}

function labelForFilter(filter: BriefFilter): string {
  if (filter === "all") return "All";
  if (filter === "archive") return "Archive";
  return filter;
}

function countForFilter(
  filter: BriefFilter,
  total: number,
  counts: CategoryCounts,
  archiveCount: number,
): number {
  if (filter === "all") return total;
  if (filter === "archive") return archiveCount;
  return counts[filter];
}
