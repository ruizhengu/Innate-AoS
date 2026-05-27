import type { CategoryCounts } from "@/types/message";

interface SummaryMetricsProps {
  counts: CategoryCounts;
  flagCount: number;
}

export function SummaryMetrics({ counts, flagCount }: SummaryMetricsProps) {
  return (
    <section className="metric-grid" aria-label="Triage summary">
      <Metric tone="decision" label="Decide" value={counts.Decide} caption="CEO-owned calls" />
      <Metric tone="delegate" label="Delegate" value={counts.Delegate} caption="handoffs drafted" />
      <Metric tone="ignore" label="Ignore" value={counts.Ignore} caption="noise suppressed" />
      <Metric tone="flags" label="Flags" value={flagCount} caption="context shifts" />
    </section>
  );
}

function Metric({
  tone,
  label,
  value,
  caption,
}: {
  tone: string;
  label: string;
  value: number;
  caption: string;
}) {
  return (
    <article className={`metric ${tone}`}>
      <span className="metric-label">{label}</span>
      <strong>{value}</strong>
      <small>{caption}</small>
    </article>
  );
}
