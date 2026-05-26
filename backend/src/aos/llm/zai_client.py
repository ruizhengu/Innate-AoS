"""Minimal Z.AI GLM chat-completions client.

This module intentionally contains only provider plumbing. Keep product-specific
triage, delegation, and briefing logic in a separate layer when the app grows.
"""

from __future__ import annotations

from dataclasses import dataclass
import json
import os
from pathlib import Path
from typing import Any, Iterable, Iterator, Literal
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


Role = Literal["system", "user", "assistant", "tool"]


@dataclass(frozen=True)
class ChatMessage:
    role: Role
    content: str

    def to_dict(self) -> dict[str, str]:
        return {"role": self.role, "content": self.content}


@dataclass(frozen=True)
class ZaiConfig:
    api_key: str
    model: str = "glm-5.1"
    base_url: str = "https://api.z.ai/api/paas/v4"
    timeout_seconds: float = 60.0

    @classmethod
    def from_env(cls, env_file: str | os.PathLike[str] | None = ".env") -> "ZaiConfig":
        if env_file is not None:
            load_env_file(env_file)

        api_key = os.environ.get("ZAI_API_KEY")
        if not api_key:
            raise ValueError("ZAI_API_KEY is required to call Z.AI.")

        return cls(
            api_key=api_key,
            model=os.environ.get("ZAI_MODEL", cls.model),
            base_url=os.environ.get("ZAI_BASE_URL", cls.base_url).rstrip("/"),
        )


class ZaiApiError(RuntimeError):
    """Raised when Z.AI returns an error or cannot be reached."""


class ZaiChatClient:
    def __init__(self, config: ZaiConfig):
        self.config = config

    def chat_completion(
        self,
        messages: Iterable[ChatMessage | dict[str, str]],
        *,
        temperature: float = 0.6,
        max_tokens: int = 4096,
        thinking_enabled: bool = True,
        response_format: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        payload = self._build_payload(
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            thinking_enabled=thinking_enabled,
            response_format=response_format,
        )
        return self._post_json("/chat/completions", payload)

    def complete_text(
        self,
        prompt: str,
        *,
        system_prompt: str | None = None,
        temperature: float = 0.6,
        max_tokens: int = 4096,
        thinking_enabled: bool = True,
    ) -> str:
        messages: list[ChatMessage] = []
        if system_prompt:
            messages.append(ChatMessage(role="system", content=system_prompt))
        messages.append(ChatMessage(role="user", content=prompt))

        response = self.chat_completion(
            messages,
            temperature=temperature,
            max_tokens=max_tokens,
            thinking_enabled=thinking_enabled,
        )
        return extract_message_content(response)

    def stream_chat_completion(
        self,
        messages: Iterable[ChatMessage | dict[str, str]],
        *,
        temperature: float = 0.6,
        max_tokens: int = 4096,
        thinking_enabled: bool = True,
    ) -> Iterator[dict[str, Any]]:
        payload = self._build_payload(
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            thinking_enabled=thinking_enabled,
        )
        payload["stream"] = True

        request = self._make_request("/chat/completions", payload)
        try:
            with urlopen(request, timeout=self.config.timeout_seconds) as response:
                for raw_line in response:
                    line = raw_line.decode("utf-8").strip()
                    if not line or not line.startswith("data:"):
                        continue
                    data = line.removeprefix("data:").strip()
                    if data == "[DONE]":
                        break
                    yield json.loads(data)
        except HTTPError as error:
            raise ZaiApiError(self._format_http_error(error)) from error
        except URLError as error:
            raise ZaiApiError(f"Could not reach Z.AI: {error.reason}") from error

    def _build_payload(
        self,
        *,
        messages: Iterable[ChatMessage | dict[str, str]],
        temperature: float,
        max_tokens: int,
        thinking_enabled: bool,
        response_format: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "model": self.config.model,
            "messages": [normalize_message(message) for message in messages],
            "thinking": {"type": "enabled" if thinking_enabled else "disabled"},
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if response_format is not None:
            payload["response_format"] = response_format
        return payload

    def _post_json(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        request = self._make_request(path, payload)
        try:
            with urlopen(request, timeout=self.config.timeout_seconds) as response:
                return json.loads(response.read().decode("utf-8"))
        except HTTPError as error:
            raise ZaiApiError(self._format_http_error(error)) from error
        except URLError as error:
            raise ZaiApiError(f"Could not reach Z.AI: {error.reason}") from error

    def _make_request(self, path: str, payload: dict[str, Any]) -> Request:
        body = json.dumps(payload).encode("utf-8")
        return Request(
            url=f"{self.config.base_url.rstrip('/')}{path}",
            data=body,
            headers={
                "Authorization": f"Bearer {self.config.api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )

    @staticmethod
    def _format_http_error(error: HTTPError) -> str:
        body = error.read().decode("utf-8", errors="replace")
        return f"Z.AI API error {error.code}: {body}"


def normalize_message(message: ChatMessage | dict[str, str]) -> dict[str, str]:
    if isinstance(message, ChatMessage):
        return message.to_dict()
    if "role" not in message or "content" not in message:
        raise ValueError("Each message must include role and content.")
    return {"role": message["role"], "content": message["content"]}


def load_env_file(path: str | os.PathLike[str]) -> None:
    env_path = Path(path)
    if not env_path.exists():
        return

    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip("\"'")
        os.environ.setdefault(key, value)


def extract_message_content(response: dict[str, Any]) -> str:
    try:
        return response["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as error:
        raise ZaiApiError(f"Unexpected Z.AI response shape: {response}") from error
