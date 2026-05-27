import json
import unittest

from aos.triage.classifier import TriageClassifier
from aos.triage.models import IncomingMessage, TriageCategory


class FakeClient:
    def __init__(self):
        self.request = None

    def chat_completion(self, messages, **kwargs):
        self.request = {"messages": messages, "kwargs": kwargs}
        return {
            "choices": [
                {
                    "message": {
                        "content": json.dumps(
                            {
                                "results": [
                                    {
                                        "message_id": 1,
                                        "category": "Decide",
                                        "confidence": "high",
                                        "reason": "Investor request needs CEO action.",
                                        "evidence": ["lock in a meeting"],
                                        "suggested_owner": "CEO",
                                        "drafted_response": "Thursday works.",
                                    }
                                ]
                            }
                        )
                    }
                }
            ]
        }


class TriageClassifierTests(unittest.TestCase):
    def test_classifier_returns_structured_result(self):
        client = FakeClient()
        classifier = TriageClassifier(client)
        message = IncomingMessage(
            id=1,
            channel="email",
            sender="Sarah",
            subject="Series B timeline",
            timestamp="2026-03-18T08:12:00Z",
            body="Can we lock in a meeting?",
        )

        results = classifier.classify_messages([message])

        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].message_id, 1)
        self.assertEqual(results[0].category, TriageCategory.DECIDE)
        self.assertEqual(results[0].evidence, ["lock in a meeting"])
        self.assertEqual(
            client.request["kwargs"]["response_format"], {"type": "json_object"}
        )
        self.assertTrue(client.request["kwargs"]["thinking_enabled"])


if __name__ == "__main__":
    unittest.main()
