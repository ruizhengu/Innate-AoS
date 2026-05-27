"""Draft reply generation."""

from __future__ import annotations

import json
from typing import Any

from aos.llm import ChatMessage, ZaiChatClient
from aos.llm.zai_client import ZaiApiError, extract_message_content


SYSTEM_PROMPT = """You draft concise replies for a CEO.

Use the triage classification and evidence to write one response the CEO could
send. Keep it direct, professional, and safe. If the message is phishing or
noise, draft a safe internal note instead of engaging with the sender.

Return only JSON in this shape:
{"drafted_response":"..."}"""


def generate_draft_reply(
    client: ZaiChatClient,
    payload: dict[str, Any],
    *,
    max_tokens: int = 512,
) -> str:
    response = client.chat_completion(
        [
            ChatMessage(role="system", content=SYSTEM_PROMPT),
            ChatMessage(role="user", content=build_prompt(payload)),
        ],
        temperature=0.35,
        max_tokens=max_tokens,
        thinking_enabled=False,
        response_format={"type": "json_object"},
    )
    content = extract_message_content(response)
    try:
        data = json.loads(content)
    except json.JSONDecodeError as error:
        raise ZaiApiError(f"Could not parse draft JSON: {content}") from error

    draft = str(data.get("drafted_response", "")).strip()
    if not draft:
        raise ZaiApiError(f"Draft response was empty: {data}")
    return draft


def build_prompt(payload: dict[str, Any]) -> str:
    return json.dumps(
        {
            "message": payload.get("message", {}),
            "triage": payload.get("triage", {}),
            "current_draft": payload.get("current_draft", ""),
            "instruction": "Regenerate the draft reply. Keep it useful as an editable first draft.",
        },
        ensure_ascii=False,
        indent=2,
    )
