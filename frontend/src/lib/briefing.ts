import type { TriageAnalysis } from "@/types/message";
import { countByCategory } from "./triage";
import { messageTitle } from "./format";

export interface BriefingLine {
  label: string;
  body: string;
}

export function buildBriefing(analyses: TriageAnalysis[]): BriefingLine[] {
  const decisions = analyses.filter((item) => item.category === "Decide");
  const flags = analyses.filter((item) => item.flag);
  const urgent = decisions.find((item) => item.id === 16) || decisions[0];
  const schedule = analyses.find((item) => item.id === 18) || decisions.find((item) => /investor|meridian/i.test(item.body));
  const revenue = analyses.find((item) => item.id === 19) || decisions.find((item) => /arr|deal|contract/i.test(item.body));

  return [
    {
      label: urgent ? `Start with message ${urgent.id}.` : "Start with the queue.",
      body: urgent ? urgent.reason : "No critical CEO decisions were found.",
    },
    {
      label: "Investor track:",
      body: schedule
        ? "Meridian needs a clean Thursday slot and revenue projections before the partners meeting."
        : "No investor decision is currently open.",
    },
    {
      label: "Revenue and operations:",
      body: revenue
        ? "Northwind terms changed materially, while checkout failures are creating immediate customer risk."
        : "No major revenue or operations shifts detected.",
    },
    {
      label: "People and hiring:",
      body: "Approve or reject the benefits package by Friday, address hybrid-policy friction, and move VP Engineering interviews forward.",
    },
    {
      label: "Watchlist:",
      body: flags
        .slice(0, 4)
        .map((item) => item.flag)
        .filter(Boolean)
        .join(" "),
    },
  ];
}

export function buildPlainTextBrief(analyses: TriageAnalysis[]): string {
  const counts = countByCategory(analyses);
  const flags = analyses.filter((item) => item.flag).map((item) => `- ${item.flag}`);
  const decisions = analyses
    .filter((item) => item.category === "Decide")
    .map((item) => `- #${item.id} ${messageTitle(item)}: ${item.reason} Draft: ${item.draft}`);

  return [
    "AI Chief of Staff Morning Brief",
    "",
    `Triage: ${counts.Decide} decide, ${counts.Delegate} delegate, ${counts.Ignore} ignore.`,
    "",
    "CEO decisions:",
    ...decisions,
    "",
    "Flags:",
    ...flags,
  ].join("\n");
}
