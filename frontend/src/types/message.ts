export type MessageChannel = "email" | "slack" | "whatsapp" | string;

export type TriageCategory = "Ignore" | "Delegate" | "Decide";

export interface IncomingMessage {
  id: number;
  channel: MessageChannel;
  from: string;
  body: string;
  timestamp?: string;
  subject?: string;
  to?: string;
  channel_name?: string;
}

export interface TriageAnalysis extends IncomingMessage {
  category: TriageCategory;
  confidence: "high" | "medium" | "low";
  reason: string;
  evidence: string[];
  owner: string;
  draft: string;
  flag?: string;
  source?: "backend" | "fallback";
}

export type CategoryCounts = Record<TriageCategory, number>;

export interface BackendTriageResult {
  message_id: number;
  category: TriageCategory;
  confidence: "high" | "medium" | "low";
  reason: string;
  evidence: string[];
  suggested_owner: string;
  drafted_response: string;
}
