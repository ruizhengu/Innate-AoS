"""CLI for classifying a messages JSON file."""

from __future__ import annotations

import argparse
from pathlib import Path
import sys
from time import sleep

from aos.llm import ZaiChatClient, ZaiConfig
from aos.llm.zai_client import ZaiApiError
from aos.triage.classifier import TriageClassifier
from aos.triage.io import dump_results, load_messages
from aos.triage.models import IncomingMessage, TriageResult


def main() -> None:
    parser = argparse.ArgumentParser(description="Classify CEO messages.")
    parser.add_argument("messages_path", type=Path, help="Path to messages JSON.")
    parser.add_argument(
        "--model",
        default=None,
        help="Override Z.AI model. Defaults to ZAI_MODEL or glm-5-turbo.",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=None,
        help="Request timeout in seconds. Defaults to ZAI_TIMEOUT_SECONDS or 180.",
    )
    parser.add_argument("--max-tokens", type=int, default=4096, help="Max output tokens.")
    parser.add_argument(
        "--batch-size",
        type=int,
        default=5,
        help="Messages per LLM request. Smaller batches reduce timeout risk.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Only classify the first N messages. Useful for quick smoke tests.",
    )
    parser.add_argument(
        "--retries",
        type=int,
        default=1,
        help="Retries per batch before splitting it further.",
    )
    parser.add_argument(
        "--thinking",
        choices=["enabled", "disabled"],
        default="disabled",
        help="Z.AI thinking mode. Disabled by default for faster structured triage.",
    )
    args = parser.parse_args()

    config = ZaiConfig.from_env()
    if args.model:
        config = ZaiConfig(
            api_key=config.api_key,
            model=args.model,
            base_url=config.base_url,
            timeout_seconds=config.timeout_seconds,
        )
    if args.timeout is not None:
        config = ZaiConfig(
            api_key=config.api_key,
            model=config.model,
            base_url=config.base_url,
            timeout_seconds=args.timeout,
        )

    classifier = TriageClassifier(
        ZaiChatClient(config),
        max_tokens=args.max_tokens,
        thinking_enabled=args.thinking == "enabled",
    )
    messages = load_messages(args.messages_path)
    if args.limit:
        messages = messages[: args.limit]
    results = classify_in_batches(
        classifier,
        messages,
        batch_size=args.batch_size,
        retries=args.retries,
    )
    print(dump_results(results))


def classify_in_batches(
    classifier: TriageClassifier,
    messages: list[IncomingMessage],
    *,
    batch_size: int,
    retries: int,
) -> list[TriageResult]:
    if batch_size < 1:
        raise ValueError("--batch-size must be at least 1.")

    results: list[TriageResult] = []
    total_batches = (len(messages) + batch_size - 1) // batch_size
    for index, start in enumerate(range(0, len(messages), batch_size), start=1):
        batch = messages[start : start + batch_size]
        ids = [message.id for message in batch]
        print(
            f"Classifying batch {index}/{total_batches}: message ids {ids}",
            file=sys.stderr,
        )
        results.extend(classify_batch_with_fallback(classifier, batch, retries=retries))
    return sorted(results, key=lambda result: result.message_id)


def classify_batch_with_fallback(
    classifier: TriageClassifier,
    messages: list[IncomingMessage],
    *,
    retries: int,
) -> list[TriageResult]:
    last_error: ZaiApiError | None = None
    for attempt in range(retries + 1):
        try:
            return classifier.classify_messages(messages)
        except ZaiApiError as error:
            last_error = error
            if attempt < retries:
                print(
                    f"Batch failed ({error}); retrying {attempt + 1}/{retries}...",
                    file=sys.stderr,
                )
                sleep(1)

    if len(messages) > 1:
        midpoint = len(messages) // 2
        ids = [message.id for message in messages]
        print(
            f"Batch {ids} still failed; splitting into smaller batches.",
            file=sys.stderr,
        )
        return [
            *classify_batch_with_fallback(
                classifier, messages[:midpoint], retries=retries
            ),
            *classify_batch_with_fallback(
                classifier, messages[midpoint:], retries=retries
            ),
        ]

    message_id = messages[0].id if messages else "unknown"
    raise ZaiApiError(f"Message {message_id} could not be classified: {last_error}")
