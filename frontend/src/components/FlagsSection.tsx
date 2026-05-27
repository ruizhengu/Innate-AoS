import { buildFlagLines } from "@/lib/briefing";

export function FlagsSection() {
  const flags = buildFlagLines();

  return (
    <section className="flags-section" aria-label="CEO flags">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Flags</p>
          <h2>Anything the CEO should know</h2>
        </div>
        <span>{flags.length}</span>
      </div>

      <div className="flag-list">
        {flags.map((flag) => (
          <article className="flag-item" key={`${flag.label}-${flag.body}`}>
            <strong>{flag.label}</strong>
            <p>{flag.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
