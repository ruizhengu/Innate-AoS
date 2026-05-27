import json
import os
import tempfile
import unittest
from unittest.mock import patch

from aos.llm.zai_client import (
    ChatMessage,
    ZaiApiError,
    ZaiChatClient,
    ZaiConfig,
    extract_message_content,
)


class FakeResponse:
    def __init__(self, payload):
        self.payload = payload

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False

    def read(self):
        return json.dumps(self.payload).encode("utf-8")


class ZaiClientTests(unittest.TestCase):
    def test_chat_completion_posts_glm_51_payload(self):
        response_payload = {
            "choices": [{"message": {"content": "Skeleton is ready."}}],
        }
        captured = {}

        def fake_urlopen(request, timeout):
            captured["url"] = request.full_url
            captured["timeout"] = timeout
            captured["headers"] = dict(request.header_items())
            captured["body"] = json.loads(request.data.decode("utf-8"))
            return FakeResponse(response_payload)

        client = ZaiChatClient(
            ZaiConfig(api_key="test-key", base_url="https://api.z.ai/api/paas/v4")
        )

        with patch("aos.llm.zai_client.urlopen", fake_urlopen):
            response = client.chat_completion(
                [ChatMessage(role="user", content="Hello")],
                max_tokens=128,
                thinking_enabled=False,
            )

        self.assertEqual(response, response_payload)
        self.assertEqual(
            captured["url"], "https://api.z.ai/api/paas/v4/chat/completions"
        )
        self.assertEqual(captured["headers"]["Authorization"], "Bearer test-key")
        self.assertEqual(captured["body"]["model"], "glm-5-turbo")
        self.assertEqual(captured["body"]["thinking"], {"type": "disabled"})
        self.assertEqual(captured["body"]["messages"][0]["content"], "Hello")
        self.assertEqual(captured["body"]["max_tokens"], 128)

    def test_complete_text_returns_message_content(self):
        client = ZaiChatClient(ZaiConfig(api_key="test-key"))

        with patch.object(
            client,
            "chat_completion",
            return_value={"choices": [{"message": {"content": "It works."}}]},
        ):
            self.assertEqual(client.complete_text("Test"), "It works.")

    def test_extract_message_content_reports_unexpected_shape(self):
        with self.assertRaises(ZaiApiError):
            extract_message_content({"choices": []})

    def test_config_can_load_local_env_file(self):
        with tempfile.NamedTemporaryFile("w", delete=False) as env_file:
            env_file.write("ZAI_API_KEY=file-key\nZAI_MODEL=glm-5.1\n")
            env_file_path = env_file.name

        try:
            with patch.dict(os.environ, {}, clear=True):
                config = ZaiConfig.from_env(env_file=env_file_path)
        finally:
            os.unlink(env_file_path)

        self.assertEqual(config.api_key, "file-key")
        self.assertEqual(config.model, "glm-5.1")

    def test_config_defaults_to_turbo(self):
        with patch.dict(os.environ, {"ZAI_API_KEY": "test-key"}, clear=True):
            config = ZaiConfig.from_env(env_file=None)

        self.assertEqual(config.model, "glm-5-turbo")


if __name__ == "__main__":
    unittest.main()
