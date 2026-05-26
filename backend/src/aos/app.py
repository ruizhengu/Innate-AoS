"""Minimal backend entrypoint for smoke-testing the LLM integration."""

from aos.llm import ZaiChatClient, ZaiConfig


def main() -> None:
    client = ZaiChatClient(ZaiConfig.from_env())
    reply = client.complete_text(
        "Reply with one short sentence confirming the GLM 5.1 backend skeleton works.",
        system_prompt="You are helping test a take-home assessment integration.",
        max_tokens=128,
        thinking_enabled=False,
    )
    print(reply)
