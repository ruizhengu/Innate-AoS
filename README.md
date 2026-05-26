# Innate-AoS

Basic full-stack skeleton for the AI Chief of Staff take-home assessment.

## Project Layout

```text
backend/
  src/aos/          Python backend source
  tests/            Backend tests
  examples/         Backend smoke-test scripts
frontend/
  src/              Frontend source placeholder
```

## Z.AI GLM 5.1 API Skeleton

The provider integration lives in `backend/src/aos/llm/zai_client.py`. It is
deliberately kept separate from any triage, delegation, or briefing logic so the
rest of the project can adapt it later.

It uses Z.AI's OpenAI-compatible chat completions endpoint:

- Base URL: `https://api.z.ai/api/paas/v4`
- Endpoint: `/chat/completions`
- Default model: `glm-5.1`

Reference: <https://docs.z.ai/guides/llm/glm-5.1>

## Setup

```bash
cd backend
uv sync
cp .env.example .env
```

Add your real key to `backend/.env`, or export it directly before running:

```bash
export ZAI_API_KEY="your-zai-api-key"
```

## Run the Mocked Tests

These tests do not call the real Z.AI API.

```bash
cd backend
uv run python -m unittest discover -s tests
```

## Try a Real Basic Call

After setting `ZAI_API_KEY`:

```bash
cd backend
uv run aos-basic-chat
```

Expected result: one short sentence from GLM 5.1 confirming the integration is
working.

## Example Usage in Future App Code

```python
from aos.llm import ZaiChatClient, ZaiConfig

client = ZaiChatClient(ZaiConfig.from_env())
reply = client.complete_text(
    "Summarize this message in one sentence: Board deck review moved to next week.",
    system_prompt="You are an assistant for a CEO.",
    thinking_enabled=False,
)
print(reply)
```
