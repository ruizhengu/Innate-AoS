import backendTriageResults from "@/data/triageResults.json";
import type { BackendTriageResult, CategoryCounts, IncomingMessage, TriageAnalysis } from "@/types/message";
import { truncate } from "./format";

const backendAnalysisByMessageId = new Map(
  (backendTriageResults as BackendTriageResult[]).map((result) => [result.message_id, result]),
);

export function analyzeMessages(messages: IncomingMessage[]): TriageAnalysis[] {
  return messages.map((message) => {
    const backendResult = backendAnalysisByMessageId.get(message.id);
    if (backendResult) return { ...message, ...fromBackendResult(backendResult) };
    return { ...message, ...classifyByRules(message), source: "fallback" };
  });
}

export function countByCategory(analyses: TriageAnalysis[]): CategoryCounts {
  return analyses.reduce<CategoryCounts>(
    (counts, analysis) => {
      counts[analysis.category] += 1;
      return counts;
    },
    { Decide: 0, Delegate: 0, Ignore: 0 },
  );
}

function classifyByRules(message: IncomingMessage): Omit<TriageAnalysis, keyof IncomingMessage> {
  const text = `${message.subject || ""} ${message.body || ""}`.toLowerCase();
  const sender = String(message.from || "").toLowerCase();
  const urgent = /(urgent|need an answer|by end of day|sign-off|approve|decision|let me know how|confirm|do we accept|roll back|hotfix)/.test(text);
  const security = /(verify|unusual login|suspended|reset\?|token=|password|secure your account)/.test(text);
  const personal = /(mum|dad|dinner|sunday|wine|love)/.test(`${sender} ${text}`);
  const newsletter = /(newsletter|unsubscribe|weekly roundup)/.test(text);
  const fyi = /(fyi|no action needed|no decisions needed|no blockers|keeping you in the loop|no changes requested)/.test(text);
  const delegate = /(can eng|onboarding|timeline|dependency|candidate|shortlist|project|deck|calendar|agenda|room|meeting)/.test(text);

  if (security) {
    return {
      category: "Delegate",
      confidence: "medium",
      reason: "Suspicious security-themed message should be handled through IT rather than clicked.",
      evidence: pickEvidence(message.body, ["verify", "unusual", "suspended"]),
      owner: "Security / IT",
      draft: "Please verify this through our internal security process. I will not click external links from the message.",
      flag: "Potential phishing or account security risk.",
    };
  }

  if (urgent) {
    return {
      category: "Decide",
      confidence: "medium",
      reason: "The message asks for a time-bound CEO decision or confirmation.",
      evidence: pickEvidence(message.body, ["decision", "confirm", "by end of day", "sign-off"]),
      owner: "CEO",
      draft: "Thanks. I will review and come back with a decision today.",
      flag: "Time-bound decision requested.",
    };
  }

  if (personal || newsletter || fyi) {
    return {
      category: "Ignore",
      confidence: "medium",
      reason: "No CEO business action is required.",
      evidence: pickEvidence(message.body, ["no action", "no decisions", "fyi", "unsubscribe"]),
      owner: personal ? "CEO" : "None",
      draft: personal ? "Thanks, noted." : "No response needed.",
    };
  }

  if (delegate) {
    return {
      category: "Delegate",
      confidence: "medium",
      reason: "A team owner can progress this and report back if it becomes CEO-level.",
      evidence: pickEvidence(message.body, ["timeline", "meeting", "project", "onboarding"]),
      owner: "Relevant functional lead",
      draft: "Please take this forward and send me only the decision points or material risks.",
    };
  }

  return {
    category: "Ignore",
    confidence: "low",
    reason: "No explicit CEO action was detected.",
    evidence: [truncate(message.body, 80)],
    owner: "None",
    draft: "No response needed.",
  };
}

function fromBackendResult(result: BackendTriageResult): Omit<TriageAnalysis, keyof IncomingMessage> {
  return {
    category: result.category,
    confidence: result.confidence,
    reason: result.reason,
    evidence: result.evidence,
    owner: result.suggested_owner || "Unassigned",
    draft: result.drafted_response || "No response needed.",
    source: "backend",
  };
}

function pickEvidence(body: string, keywords: string[]): string[] {
  const sentences = body
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
  const matches = sentences.filter((sentence) =>
    keywords.some((keyword) => sentence.toLowerCase().includes(keyword)),
  );
  return (matches.length ? matches : sentences).slice(0, 3).map((item) => truncate(item, 92));
}
