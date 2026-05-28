import { buildFlagLines } from "@/lib/briefing";
import type { DailyBriefing } from "@/types/message";

interface FlagsSectionProps {
  briefing: DailyBriefing | null;
  loading: boolean;
}

export function FlagsSection({ briefing, loading }: FlagsSectionProps) {
  const flags = briefing ? buildFlagLines(briefing) : [];

  return (
    <section className="flags-section" aria-label="CEO flags">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Flags</p>
          <h2>Anything the CEO should know</h2>
        </div>
        <span>{loading ? "..." : flags.length}</span>
      </div>

      {loading ? (
        <div className="processing-strip compact">
          <span className="row-spinner" />
          <p>Flags will be generated after all message batches finish.</p>
        </div>
      ) : null}

      <div className="flag-list">
        {flags.length ? flags.map((flag) => (
          <article className="flag-item" key={`${flag.label}-${flag.body}`}>
            <strong>{flag.label}</strong>
            <p>{flag.body}</p>
          </article>
        )) : (
          <article className="flag-item muted">
            <strong>{loading ? "Processing" : "No flags yet"}</strong>
            <p>{loading ? "Flags will appear after all message batches are classified." : "Upload messages to generate flags."}</p>
          </article>
        )}
      </div>
    </section>
  );
}
