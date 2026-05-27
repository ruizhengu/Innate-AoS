"""LLM-backed daily briefing generation."""

from __future__ import annotations

from dataclasses import dataclass
import json
from typing import Any

from aos.llm import ChatMessage, ZaiChatClient
from aos.llm.zai_client import ZaiApiError, extract_message_content
from aos.triage.models import IncomingMessage, TriageResult


SYSTEM_PROMPT = """You write a CEO's morning briefing from triaged communications.

The brief must be readable in under two minutes. Prioritize only what changes
the CEO's day: decisions, risks, deadlines, major commercial changes, security
issues, and important follow-ups.

Return only JSON with this exact shape:
{
  "headline": "...",
  "top_priority": {"message_id": 0, "title": "...", "summary": "..."},
  "sections": [
    {"title": "...", "summary": "...", "message_ids": [1, 2]}
  ],
  "flags": [
    {"severity": "critical|high|medium|low", "summary": "...", "message_ids": [1]}
  ],
  "next_actions": [
    {"owner": "...", "action": "...", "message_ids": [1]}
  ]
}

Do not invent facts. Reference message ids whenever possible."""


@dataclass(frozen=True)
class DailyBriefing:
    headline: str
    top_priority: dict[str, Any]
    sections: list[dict[str, Any]]
    flags: list[dict[str, Any]]
    next_actions: list[dict[str, Any]]

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "DailyBriefing":
        return cls(
            headline=str(data.get("headline", "")),
            top_priority=dict(data.get("top_priority", {})),
            sections=list(data.get("sections", [])),
            flags=list(data.get("flags", [])),
            next_actions=list(data.get("next_actions", [])),
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "headline": self.headline,
            "top_priority": self.top_priority,
            "sections": self.sections,
            "flags": self.flags,
            "next_actions": self.next_actions,
        }


class DailyBriefingGenerator:
    def __init__(self, client: ZaiChatClient):
        self.client = client

    def generate(
        self,
        messages: list[IncomingMessage],
        triage_results: list[TriageResult],
    ) -> DailyBriefing:
        response = self.client.chat_completion(
            [
                ChatMessage(role="system", content=SYSTEM_PROMPT),
                ChatMessage(
                    role="user",
                    content=build_prompt(messages, triage_results),
                ),
            ],
            temperature=0.2,
            max_tokens=2048,
            thinking_enabled=False,
            response_format={"type": "json_object"},
        )
        content = extract_message_content(response)
        try:
            data = json.loads(content)
        except json.JSONDecodeError as error:
            raise ZaiApiError(f"Could not parse briefing JSON: {content}") from error

        briefing = DailyBriefing.from_dict(data)
        validate_briefing(briefing)
        return briefing


def build_prompt(
    messages: list[IncomingMessage],
    triage_results: list[TriageResult],
) -> str:
    message_by_id = {message.id: message for message in messages}
    items = []
    for result in triage_results:
        message = message_by_id.get(result.message_id)
        items.append(
            {
                "message": message.to_prompt_dict() if message else {"id": result.message_id},
                "triage": result.to_dict(),
            }
        )

    return json.dumps(
        {
            "instruction": "Create the daily briefing from these triaged messages.",
            "items": items,
        },
        ensure_ascii=False,
        indent=2,
    )


def validate_briefing(briefing: DailyBriefing) -> None:
    if not briefing.headline:
        raise ZaiApiError("Briefing headline is missing.")
    if not briefing.top_priority:
        raise ZaiApiError("Briefing top_priority is missing.")
    if not briefing.sections:
        raise ZaiApiError("Briefing sections are missing.")
