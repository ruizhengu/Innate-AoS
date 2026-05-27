import json
import unittest

from aos.api.drafts import build_prompt, generate_draft_reply


class FakeClient:
    def chat_completion(self, messages, **kwargs):
        self.messages = messages
        self.kwargs = kwargs
        return {
            "choices": [
                {
                    "message": {
                        "content": json.dumps(
                            {"drafted_response": "Thanks, I will review this today."}
                        )
                    }
                }
            ]
        }


class DraftApiTests(unittest.TestCase):
    def test_generate_draft_reply_returns_structured_draft(self):
        client = FakeClient()
        draft = generate_draft_reply(
            client,
            {
                "message": {"id": 1, "body": "Can you review this?"},
                "triage": {"category": "Decide", "reason": "Needs CEO review."},
            },
        )

        self.assertEqual(draft, "Thanks, I will review this today.")
        self.assertEqual(client.kwargs["response_format"], {"type": "json_object"})
        self.assertFalse(client.kwargs["thinking_enabled"])

    def test_build_prompt_includes_current_draft(self):
        prompt = build_prompt({"current_draft": "Current text"})

        self.assertIn("Current text", prompt)


if __name__ == "__main__":
    unittest.main()
