"""Small local HTTP API for frontend interactions."""

from __future__ import annotations

import argparse
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from time import sleep
from typing import Any

from aos.api.drafts import generate_draft_reply
from aos.briefing.generator import DailyBriefingGenerator
from aos.llm import ZaiChatClient, ZaiConfig
from aos.llm.zai_client import ZaiApiError
from aos.triage.classifier import TriageClassifier
from aos.triage.models import IncomingMessage, TriageResult


class AosApiHandler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    client: ZaiChatClient

    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.NO_CONTENT)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self) -> None:
        if self.path == "/health":
            self._send_json({"ok": True})
            return
        self._send_json({"error": "Not found"}, status=HTTPStatus.NOT_FOUND)

    def do_POST(self) -> None:
        if self.path == "/api/draft-reply":
            self._handle_draft_reply()
            return
        if self.path == "/api/triage-stream":
            self._handle_triage_stream()
            return
        if self.path == "/api/daily-briefing":
            self._handle_daily_briefing()
            return

        self._send_json({"error": "Not found"}, status=HTTPStatus.NOT_FOUND)

    def _handle_draft_reply(self) -> None:
        try:
            payload = self._read_json()
            draft = generate_draft_reply(self.client, payload)
        except (ValueError, ZaiApiError) as error:
            self._send_json({"error": str(error)}, status=HTTPStatus.BAD_GATEWAY)
            return

        self._send_json({"drafted_response": draft})

    def _handle_daily_briefing(self) -> None:
        try:
            payload = self._read_json()
            messages = parse_messages(payload)
            triage_results = parse_triage_results(payload)
            briefing = DailyBriefingGenerator(self.client).generate(messages, triage_results)
        except (ValueError, ZaiApiError) as error:
            self._send_json({"error": str(error)}, status=HTTPStatus.BAD_GATEWAY)
            return

        self._send_json(briefing.to_dict())

    def _handle_triage_stream(self) -> None:
        try:
            payload = self._read_json()
            messages = parse_messages(payload)
            batch_size = int(payload.get("batch_size", 5))
            retries = int(payload.get("retries", 1))
            if batch_size < 1:
                raise ValueError("batch_size must be at least 1.")
        except ValueError as error:
            self._send_json({"error": str(error)}, status=HTTPStatus.BAD_REQUEST)
            return

        classifier = TriageClassifier(self.client, thinking_enabled=False)
        total_batches = (len(messages) + batch_size - 1) // batch_size
        all_results: list[TriageResult] = []

        self.send_response(HTTPStatus.OK)
        self._send_cors_headers()
        self.send_header("Content-Type", "application/x-ndjson")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Transfer-Encoding", "chunked")
        self.end_headers()

        self._send_event(
            {
                "type": "started",
                "total": len(messages),
                "batch_size": batch_size,
                "total_batches": total_batches,
            }
        )

        try:
            for index, start in enumerate(range(0, len(messages), batch_size), start=1):
                batch = messages[start : start + batch_size]
                ids = [message.id for message in batch]
                self._send_event({"type": "batch_started", "batch": index, "message_ids": ids})
                results = classify_batch_with_fallback(classifier, batch, retries=retries)
                all_results.extend(results)
                self._send_event(
                    {
                        "type": "batch_completed",
                        "batch": index,
                        "message_ids": ids,
                        "results": [result.to_dict() for result in results],
                    }
                )

            all_results = sorted(all_results, key=lambda result: result.message_id)
            self._send_event(
                {
                    "type": "completed",
                    "results": [result.to_dict() for result in all_results],
                }
            )
        except ZaiApiError as error:
            self._send_event({"type": "error", "error": str(error)})
        finally:
            self._finish_events()
            self.close_connection = True

    def log_message(self, format: str, *args: Any) -> None:
        return

    def _read_json(self) -> dict[str, Any]:
        content_length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(content_length)
        data = json.loads(body.decode("utf-8"))
        if not isinstance(data, dict):
            raise ValueError("Expected JSON object.")
        return data

    def _send_json(self, payload: dict[str, Any], *, status: HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self._send_cors_headers()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_event(self, payload: dict[str, Any]) -> None:
        body = json.dumps(payload).encode("utf-8") + b"\n"
        self.wfile.write(f"{len(body):X}\r\n".encode("ascii"))
        self.wfile.write(body)
        self.wfile.write(b"\r\n")
        self.wfile.flush()

    def _finish_events(self) -> None:
        self.wfile.write(b"0\r\n\r\n")
        self.wfile.flush()

    def _send_cors_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")


def parse_messages(payload: dict[str, Any]) -> list[IncomingMessage]:
    raw_messages = payload.get("messages")
    if not isinstance(raw_messages, list):
        raise ValueError("Expected messages array.")
    return [IncomingMessage.from_dict(item) for item in raw_messages]


def parse_triage_results(payload: dict[str, Any]) -> list[TriageResult]:
    raw_results = payload.get("triage_results")
    if not isinstance(raw_results, list):
        raise ValueError("Expected triage_results array.")
    return [TriageResult.from_dict(item) for item in raw_results]


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
                sleep(1)

    if len(messages) > 1:
        midpoint = len(messages) // 2
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


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the local AoS backend API.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()

    AosApiHandler.client = ZaiChatClient(ZaiConfig.from_env())
    server = ThreadingHTTPServer((args.host, args.port), AosApiHandler)
    print(f"AoS API listening on http://{args.host}:{args.port}")
    server.serve_forever()
