import type {
  BackendTriageResult,
  DailyBriefing,
  IncomingMessage,
  TriageStreamEvent,
} from "@/types/message";

const DEFAULT_API_URL = "http://127.0.0.1:8000";

export function apiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_AOS_API_URL || DEFAULT_API_URL;
}

export async function streamTriage(
  messages: IncomingMessage[],
  onEvent: (event: TriageStreamEvent) => void,
): Promise<BackendTriageResult[]> {
  const response = await fetch(`${apiBaseUrl()}/api/triage-stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, batch_size: 5, retries: 1 }),
  });

  if (!response.ok || !response.body) {
    throw new Error(await responseText(response, "Could not start triage"));
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let completedResults: BackendTriageResult[] = [];

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line) as TriageStreamEvent;
      onEvent(event);
      if (event.type === "completed") completedResults = event.results;
      if (event.type === "error") throw new Error(event.error);
    }
  }

  if (buffer.trim()) {
    const event = JSON.parse(buffer) as TriageStreamEvent;
    onEvent(event);
    if (event.type === "completed") completedResults = event.results;
    if (event.type === "error") throw new Error(event.error);
  }

  return completedResults;
}

export async function generateDailyBriefing(
  messages: IncomingMessage[],
  triageResults: BackendTriageResult[],
): Promise<DailyBriefing> {
  const response = await fetch(`${apiBaseUrl()}/api/daily-briefing`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, triage_results: triageResults }),
  });

  if (!response.ok) {
    throw new Error(await responseText(response, "Could not generate daily briefing"));
  }
  return (await response.json()) as DailyBriefing;
}

async function responseText(response: Response, fallback: string): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error || fallback;
  } catch {
    return fallback;
  }
}
