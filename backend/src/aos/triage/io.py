"""Input/output helpers for triage data."""

from __future__ import annotations

import json
from pathlib import Path

from aos.triage.models import IncomingMessage, TriageResult


def load_messages(path: str | Path) -> list[IncomingMessage]:
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValueError("Messages file must contain a JSON list.")
    return [IncomingMessage.from_dict(item) for item in data]


def dump_results(results: list[TriageResult]) -> str:
    return dump_json([result.to_dict() for result in results])


def load_triage_results(path: str | Path) -> list[TriageResult]:
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValueError("Triage file must contain a JSON list.")
    return [TriageResult.from_dict(item) for item in data]


def dump_json(data: object) -> str:
    return json.dumps(data, indent=2)
