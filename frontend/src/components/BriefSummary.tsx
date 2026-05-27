"use client";

import { useState } from "react";
import { buildBriefingPreview, buildBriefingSections } from "@/lib/briefing";

export function BriefSummary() {
  const [open, setOpen] = useState(false);
  const preview = buildBriefingPreview();
  const sections = buildBriefingSections();

  return (
    <section className="summary-strip" aria-label="Daily brief highlights">
      <div className="summary-headline">
        <p>
          <strong>{preview.label}</strong> {preview.body}
        </p>
        <button
          aria-label="Open full brief"
          className="summary-open-button"
          type="button"
          onClick={() => setOpen(true)}
        >
          Open full brief
        </button>
      </div>

      {open ? <DailyBriefModal sections={sections} headline={preview.body} onClose={() => setOpen(false)} /> : null}
    </section>
  );
}

function DailyBriefModal({
  headline,
  sections,
  onClose,
}: {
  headline: string;
  sections: ReturnType<typeof buildBriefingSections>;
  onClose: () => void;
}) {
  return (
    <div className="daily-brief-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        aria-label="Full daily briefing"
        aria-modal="true"
        className="daily-brief-modal"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="daily-brief-modal-header">
          <div>
            <p className="eyebrow">Daily briefing</p>
            <h2>{headline}</h2>
          </div>
          <button className="icon-button" type="button" aria-label="Close daily briefing" onClick={onClose}>
            x
          </button>
        </header>

        <div className="daily-brief-modal-content">
          {sections.map((section) => (
            <section className="daily-brief-section" key={section.title}>
              <h3>{section.title}</h3>
              {section.lines.map((line) => (
                <p key={`${section.title}-${line.label}-${line.body}`}>
                  <strong>{line.label}</strong> {line.body}
                </p>
              ))}
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}
