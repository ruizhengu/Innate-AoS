"""CLI for generating the daily briefing artifact."""

from __future__ import annotations

import argparse
from pathlib import Path

from aos.briefing.generator import DailyBriefingGenerator
from aos.llm import ZaiChatClient, ZaiConfig
from aos.triage.io import dump_json, load_messages, load_triage_results


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate a CEO daily briefing.")
    parser.add_argument("--messages", type=Path, default=Path("../Messages.json"))
    parser.add_argument("--triage", type=Path, default=Path("triage-results.json"))
    parser.add_argument("--output", type=Path, default=Path("daily-briefing.json"))
    args = parser.parse_args()

    generator = DailyBriefingGenerator(ZaiChatClient(ZaiConfig.from_env()))
    briefing = generator.generate(
        load_messages(args.messages),
        load_triage_results(args.triage),
    )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    temp_output = args.output.with_suffix(f"{args.output.suffix}.tmp")
    temp_output.write_text(dump_json(briefing.to_dict()) + "\n", encoding="utf-8")
    temp_output.replace(args.output)
    print(f"Wrote daily briefing to {args.output}")
