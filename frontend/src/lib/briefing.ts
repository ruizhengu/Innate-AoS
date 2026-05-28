import type { DailyBriefing } from "@/types/message";

export interface BriefingLine {
  label: string;
  body: string;
}

export function buildBriefing(briefing: DailyBriefing): BriefingLine[] {
  return [
    {
      label: "Top priority:",
      body: briefing.top_priority.summary,
    },
    ...briefing.sections.map((section) => ({
      label: `${section.title || "Briefing"}:`,
      body: section.summary,
    })),
  ];
}

export function buildBriefingPreview(briefing: DailyBriefing): BriefingLine {
  return {
    label: "Daily briefing:",
    body: briefing.headline,
  };
}

export function buildFlagLines(briefing: DailyBriefing): BriefingLine[] {
  return briefing.flags.map((flag) => ({
    label: `${titleCase(flag.severity)} risk:`,
    body: flag.summary,
  }));
}

export function buildBriefingSections(briefing: DailyBriefing): { title: string; lines: BriefingLine[] }[] {
  return [
    {
      title: "Brief",
      lines: buildBriefing(briefing),
    },
  ];
}

function titleCase(value: string): string {
  return value ? `${value[0].toUpperCase()}${value.slice(1)}` : "Flag";
}
