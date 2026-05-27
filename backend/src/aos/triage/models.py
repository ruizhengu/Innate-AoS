"""Domain models for CEO message triage."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class TriageCategory(str, Enum):
    IGNORE = "Ignore"
    DELEGATE = "Delegate"
    DECIDE = "Decide"


@dataclass(frozen=True)
class IncomingMessage:
    id: int
    channel: str
    sender: str
    body: str
    timestamp: str | None = None
    subject: str | None = None
    recipient: str | None = None
    channel_name: str | None = None
    raw: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "IncomingMessage":
        return cls(
            id=int(data["id"]),
            channel=str(data["channel"]),
            sender=str(data.get("from", "")),
            recipient=data.get("to"),
            subject=data.get("subject"),
            timestamp=data.get("timestamp"),
            channel_name=data.get("channel_name"),
            body=str(data.get("body", "")),
            raw=data,
        )

    def to_prompt_dict(self) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "id": self.id,
            "channel": self.channel,
            "from": self.sender,
            "timestamp": self.timestamp,
            "body": self.body,
        }
        if self.subject:
            payload["subject"] = self.subject
        if self.recipient:
            payload["to"] = self.recipient
        if self.channel_name:
            payload["channel_name"] = self.channel_name
        return payload


@dataclass(frozen=True)
class TriageResult:
    message_id: int
    category: TriageCategory
    confidence: str
    reason: str
    evidence: list[str]
    suggested_owner: str
    drafted_response: str

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "TriageResult":
        return cls(
            message_id=int(data["message_id"]),
            category=TriageCategory(str(data["category"])),
            confidence=str(data.get("confidence", "medium")),
            reason=str(data["reason"]),
            evidence=[str(item) for item in data.get("evidence", [])],
            suggested_owner=str(data.get("suggested_owner", "")),
            drafted_response=str(data.get("drafted_response", "")),
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "message_id": self.message_id,
            "category": self.category.value,
            "confidence": self.confidence,
            "reason": self.reason,
            "evidence": self.evidence,
            "suggested_owner": self.suggested_owner,
            "drafted_response": self.drafted_response,
        }
