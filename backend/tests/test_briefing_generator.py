import json
import unittest

from aos.briefing.generator import DailyBriefingGenerator, build_prompt
from aos.triage.models import IncomingMessage, TriageCategory, TriageResult


class FakeClient:
    def chat_completion(self, messages, **kwargs):
        self.messages = messages
        self.kwargs = kwargs
        return {
            "choices": [
                {
                    "message": {
                        "content": json.dumps(
                            {
                                "headline": "Checkout risk needs a CEO decision.",
                                "top_priority": {
                                    "message_id": 16,
                                    "title": "Checkout failures",
                                    "summary": "Live checkout failures need a rollback or hotfix call.",
                                },
                                "sections": [
                                    {
                                        "title": "Operations",
                                        "summary": "Payment dependency is affecting customers.",
                                        "message_ids": [16],
                                    }
                                ],
                                "flags": [
                                    {
                                        "severity": "critical",
                                        "summary": "Live transactions affected.",
                                        "message_ids": [16],
                                    }
                                ],
                                "next_actions": [
                                    {
                                        "owner": "CEO",
                                        "action": "Decide rollback versus hotfix.",
                                        "message_ids": [16],
                                    }
                                ],
                            }
                        )
                    }
                }
            ]
        }


class BriefingGeneratorTests(unittest.TestCase):
    def test_generator_returns_structured_briefing(self):
        generator = DailyBriefingGenerator(FakeClient())
        briefing = generator.generate(
            [
                IncomingMessage(
                    id=16,
                    channel="slack",
                    sender="tom",
                    body="Need a decision in the next hour.",
                )
            ],
            [
                TriageResult(
                    message_id=16,
                    category=TriageCategory.DECIDE,
                    confidence="high",
                    reason="Production issue needs CEO decision.",
                    evidence=["next hour"],
                    suggested_owner="CEO",
                    drafted_response="Roll back.",
                )
            ],
        )

        self.assertEqual(briefing.top_priority["message_id"], 16)
        self.assertEqual(briefing.flags[0]["severity"], "critical")

    def test_build_prompt_pairs_messages_and_triage(self):
        prompt = build_prompt(
            [IncomingMessage(id=1, channel="email", sender="a", body="hello")],
            [
                TriageResult(
                    message_id=1,
                    category=TriageCategory.IGNORE,
                    confidence="high",
                    reason="No action.",
                    evidence=["hello"],
                    suggested_owner="None",
                    drafted_response="",
                )
            ],
        )

        self.assertIn('"message_id": 1', prompt)
        self.assertIn('"body": "hello"', prompt)


if __name__ == "__main__":
    unittest.main()
