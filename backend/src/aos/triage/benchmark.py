"""Compare GLM model latency and triage output for the sample inbox."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from time import perf_counter
from typing import Any

from aos.llm import ZaiChatClient, ZaiConfig
from aos.llm.zai_client import ZaiApiError
from aos.triage.classifier import TriageClassifier
from aos.triage.io import load_messages


DEFAULT_MODELS = ("glm-5.1", "glm-5-turbo")


def main() -> None:
    parser = argparse.ArgumentParser(description="Benchmark Z.AI triage models.")
    parser.add_argument("messages_path", type=Path, help="Path to messages JSON.")
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Only classify the first N messages. Defaults to all messages.",
    )
    parser.add_argument(
        "--thinking",
        choices=["enabled", "disabled"],
        default="disabled",
        help="Z.AI thinking mode.",
    )
    parser.add_argument("--timeout", type=float, default=180.0, help="Request timeout.")
    parser.add_argument("--max-tokens", type=int, default=4096, help="Max output tokens.")
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Optional path to write benchmark JSON.",
    )
    args = parser.parse_args()

    messages = load_messages(args.messages_path)
    if args.limit:
        messages = messages[: args.limit]

    base_config = ZaiConfig.from_env()
    runs = []
    for model in DEFAULT_MODELS:
        config = ZaiConfig(
            api_key=base_config.api_key,
            model=model,
            base_url=base_config.base_url,
            timeout_seconds=args.timeout,
        )
        classifier = TriageClassifier(
            ZaiChatClient(config),
            max_tokens=args.max_tokens,
            thinking_enabled=args.thinking == "enabled",
        )

        start = perf_counter()
        elapsed_seconds = perf_counter() - start
        try:
            results = classifier.classify_messages(messages)
        except ZaiApiError as error:
            elapsed_seconds = perf_counter() - start
            runs.append(
                {
                    "model": model,
                    "elapsed_seconds": round(elapsed_seconds, 3),
                    "messages_classified": 0,
                    "error": str(error),
                }
            )
        else:
            elapsed_seconds = perf_counter() - start
            runs.append(
                {
                    "model": model,
                    "elapsed_seconds": round(elapsed_seconds, 3),
                    "messages_classified": len(results),
                    "avg_seconds_per_message": round(
                        elapsed_seconds / len(results), 3
                    ),
                    "results": [result.to_dict() for result in results],
                }
            )

    report: dict[str, Any] = {
        "thinking": args.thinking,
        "input_messages": len(messages),
        "runs": runs,
    }
    output = json.dumps(report, indent=2)
    if args.output:
        args.output.write_text(output + "\n", encoding="utf-8")
    print(output)
