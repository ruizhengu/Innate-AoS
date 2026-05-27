import type { CategoryCounts } from "@/types/message";

interface DailyBriefHeaderProps {
  counts: CategoryCounts;
  flagCount: number;
  onUpload: (file: File) => void;
}

export function DailyBriefHeader({ counts, flagCount, onUpload }: DailyBriefHeaderProps) {
  return (
    <header className="brief-header">
      <div className="brief-title-block">
        <p className="eyebrow">AI Chief of Staff</p>
        <h1>Daily Brief</h1>
        <p className="brief-subtitle">
          {counts.Decide} decisions, {counts.Delegate} delegations, {flagCount} flags.
        </p>
      </div>

      <div className="header-actions">
        <label className="secondary-button" title="Load a new messages.json file">
          <input
            type="file"
            accept=".json,application/json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onUpload(file);
              event.target.value = "";
            }}
          />
          <span>Load JSON</span>
        </label>
      </div>
    </header>
  );
}
