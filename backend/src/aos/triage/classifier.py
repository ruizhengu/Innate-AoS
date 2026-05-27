"""LLM-backed classification pipeline for CEO message triage."""

from __future__ import annotations

import json
from typing import Any

from aos.llm import ChatMessage, ZaiChatClient
from aos.llm.zai_client import ZaiApiError, extract_message_content
from aos.triage.models import IncomingMessage, TriageResult


SYSTEM_PROMPT = """You classify a CEO's morning communications.

Classify every message into exactly one category:
- Ignore: no CEO involvement is needed, spam/noise, personal non-work items, or pure FYI with no decision.
- Delegate: someone else can handle it; include the best suggested owner and a clear handoff.
- Decide: the CEO must personally decide, approve, attend, reply, or resolve a sensitive issue.

Return only valid JSON. Do not wrap it in Markdown.
For every message, include:
- message_id: original numeric id
- category: one of Ignore, Delegate, Decide
- confidence: high, medium, or low
- reason: one concise sentence explaining the classification
- evidence: 1 to 3 short direct snippets copied from the message
- suggested_owner: CEO, a role, or a named person when available
- drafted_response: a concise response or delegation handoff the CEO could send

Evidence must be direct text from the original message. If the message is phishing
or suspicious, say so plainly in reason and draft a safe non-clicking action.
If uncertain, use low confidence and surface the uncertainty in reason."""


class TriageClassifier:
    def __init__(
        self,
        client: ZaiChatClient,
        *,
        temperature: float = 0.1,
        max_tokens: int = 4096,
        thinking_enabled: bool = True,
    ):
        self.client = client
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.thinking_enabled = thinking_enabled

    def classify_messages(self, messages: list[IncomingMessage]) -> list[TriageResult]:
        if not messages:
            return []

        response = self.client.chat_completion(
            [
                ChatMessage(role="system", content=SYSTEM_PROMPT),
                ChatMessage(role="user", content=self._build_user_prompt(messages)),
            ],
            temperature=self.temperature,
            max_tokens=self.max_tokens,
            thinking_enabled=self.thinking_enabled,
            response_format={"type": "json_object"},
        )
        content = extract_message_content(response)
        data = parse_json_object(content)
        raw_results = data.get("results", data)
        if not isinstance(raw_results, list):
            raise ZaiApiError(f"Expected triage results list, received: {data}")

        results = [TriageResult.from_dict(item) for item in raw_results]
        validate_results(messages, results)
        return results

    @staticmethod
    def _build_user_prompt(messages: list[IncomingMessage]) -> str:
        payload = [message.to_prompt_dict() for message in messages]
        return (
            "Classify these messages for the CEO. Return JSON with a top-level "
            '"results" array.\n\n'
            f"{json.dumps(payload, ensure_ascii=False, indent=2)}"
        )


def parse_json_object(content: str) -> Any:
    cleaned = content.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.removeprefix("```json").removeprefix("```").strip()
        cleaned = cleaned.removesuffix("```").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as error:
        raise ZaiApiError(f"Could not parse triage JSON: {content}") from error


def validate_results(
    messages: list[IncomingMessage], results: list[TriageResult]
) -> None:
    expected_ids = {message.id for message in messages}
    actual_ids = {result.message_id for result in results}
    if expected_ids != actual_ids:
        raise ZaiApiError(
            f"Triage result ids did not match input ids. "
            f"Expected {sorted(expected_ids)}, got {sorted(actual_ids)}."
        )

    for result in results:
        if not result.evidence:
            raise ZaiApiError(f"Message {result.message_id} has no evidence.")
