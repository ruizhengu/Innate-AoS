import type {
  BackendTriageResult,
  CategoryCounts,
  IncomingMessage,
  TriageAnalysis,
} from "@/types/message";

export function countByCategory(analyses: TriageAnalysis[]): CategoryCounts {
  return analyses.reduce<CategoryCounts>(
    (counts, analysis) => {
      counts[analysis.category] += 1;
      return counts;
    },
    { Decide: 0, Delegate: 0, Ignore: 0 },
  );
}

export function analysisFromBackendResult(
  message: IncomingMessage,
  result: BackendTriageResult,
): TriageAnalysis {
  return {
    ...message,
    category: result.category,
    confidence: result.confidence,
    reason: result.reason,
    evidence: result.evidence,
    owner: result.suggested_owner || "Unassigned",
    draft: result.drafted_response || "No response needed.",
    source: "backend",
  };
}
