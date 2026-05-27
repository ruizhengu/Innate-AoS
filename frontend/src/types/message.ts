export type MessageChannel = "email" | "slack" | "whatsapp" | string;

export type TriageCategory = "Ignore" | "Delegate" | "Decide";

export type BriefFilter = TriageCategory | "all" | "archive";

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

export interface MessageWorkflowState {
  archived?: boolean;
  assignedTo?: string;
  completed?: boolean;
}

export interface BackendTriageResult {
  message_id: number;
  category: TriageCategory;
  confidence: "high" | "medium" | "low";
  reason: string;
  evidence: string[];
  suggested_owner: string;
  drafted_response: string;
}

export interface DailyBriefingItem {
  title?: string;
  summary: string;
  message_ids: number[];
}

export interface DailyBriefingFlag {
  severity: "critical" | "high" | "medium" | "low" | string;
  summary: string;
  message_ids: number[];
}

export interface DailyBriefingAction {
  owner: string;
  action: string;
  message_ids: number[];
}

export interface DailyBriefing {
  headline: string;
  top_priority: DailyBriefingItem & { message_id?: number };
  sections: DailyBriefingItem[];
  flags: DailyBriefingFlag[];
  next_actions: DailyBriefingAction[];
}
