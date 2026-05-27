import type { TriageAnalysis } from "@/types/message";

export function formatTime(timestamp?: string): string {
  if (!timestamp) return "No time";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "No time";

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

export function messageTitle(message: Pick<TriageAnalysis, "subject" | "from" | "channel">): string {
  return message.subject || `${message.from || "Unknown"} via ${message.channel || "message"}`;
}

export function truncate(value: string | undefined, maxLength: number): string {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text;
}
