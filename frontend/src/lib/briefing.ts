import dailyBriefing from "@/data/dailyBriefing.json";
import type { DailyBriefing } from "@/types/message";

export interface BriefingLine {
  label: string;
  body: string;
}

const generatedBriefing = dailyBriefing as DailyBriefing;

function buildBriefing(): BriefingLine[] {
  return [
    {
      label: "Top priority:",
      body: generatedBriefing.top_priority.summary,
    },
    ...generatedBriefing.sections.map((section) => ({
      label: `${section.title || "Briefing"}:`,
      body: section.summary,
    })),
  ];
}

export function buildBriefingPreview(): BriefingLine {
  return {
    label: "Daily briefing:",
    body: generatedBriefing.headline,
  };
}

function buildFlagLines(): BriefingLine[] {
  return generatedBriefing.flags.map((flag) => ({
    label: `${titleCase(flag.severity)} risk:`,
    body: flag.summary,
  }));
}

function buildNextActionLines(): BriefingLine[] {
  return generatedBriefing.next_actions.map((item) => ({
    label: `${item.owner}:`,
    body: item.action,
  }));
}

export function buildBriefingSections(): { title: string; lines: BriefingLine[] }[] {
  return [
    {
      title: "Brief",
      lines: buildBriefing(),
    },
    {
      title: "Flags",
      lines: buildFlagLines(),
    },
    {
      title: "Next Actions",
      lines: buildNextActionLines(),
    },
  ];
}

function titleCase(value: string): string {
  return value ? `${value[0].toUpperCase()}${value.slice(1)}` : "Flag";
}
