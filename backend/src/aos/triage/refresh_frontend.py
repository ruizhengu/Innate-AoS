"""Refresh the frontend triage JSON without leaving partial files behind."""

from __future__ import annotations

import argparse
from pathlib import Path

from aos.llm import ZaiChatClient, ZaiConfig
from aos.triage.cli import classify_in_batches
from aos.triage.classifier import TriageClassifier
from aos.triage.io import dump_results, load_messages


def main() -> None:
    parser = argparse.ArgumentParser(description="Refresh frontend triage data.")
    parser.add_argument(
        "--messages",
        type=Path,
        default=Path("../Messages.json"),
        help="Path to messages JSON.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("../frontend/src/data/triageResults.json"),
        help="Frontend triage JSON output path.",
    )
    parser.add_argument("--batch-size", type=int, default=5)
    parser.add_argument("--retries", type=int, default=1)
    parser.add_argument("--timeout", type=float, default=None)
    args = parser.parse_args()

    config = ZaiConfig.from_env()
    if args.timeout is not None:
        config = ZaiConfig(
            api_key=config.api_key,
            model=config.model,
            base_url=config.base_url,
            timeout_seconds=args.timeout,
        )

    classifier = TriageClassifier(
        ZaiChatClient(config),
        thinking_enabled=False,
    )
    results = classify_in_batches(
        classifier,
        load_messages(args.messages),
        batch_size=args.batch_size,
        retries=args.retries,
    )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    temp_output = args.output.with_suffix(f"{args.output.suffix}.tmp")
    temp_output.write_text(dump_results(results) + "\n", encoding="utf-8")
    temp_output.replace(args.output)
    print(f"Wrote {len(results)} triage results to {args.output}")
