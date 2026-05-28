import type { TriageAnalysis } from "@/types/message";
import { apiBaseUrl } from "./api";

export async function regenerateDraft(analysis: TriageAnalysis, currentDraft: string): Promise<string> {
  const response = await fetch(`${apiBaseUrl()}/api/draft-reply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: {
        id: analysis.id,
        channel: analysis.channel,
        from: analysis.from,
        subject: analysis.subject,
        body: analysis.body,
      },
      triage: {
        category: analysis.category,
        confidence: analysis.confidence,
        reason: analysis.reason,
        evidence: analysis.evidence,
        owner: analysis.owner,
      },
      current_draft: currentDraft,
    }),
  });

  const payload = (await response.json()) as { drafted_response?: string; error?: string };
  if (!response.ok || !payload.drafted_response) {
    throw new Error(payload.error || "Could not regenerate draft");
  }
  return payload.drafted_response;
}
