# Innate-AoS

Basic full-stack skeleton for the AI Chief of Staff take-home assessment.

## Project Layout

```text
backend/
  src/aos/          Python backend source
  tests/            Backend tests
  evaluation/       Manual evaluation set
frontend/
  src/              Frontend source
```

## Z.AI Backend

The provider integration lives in `backend/src/aos/llm/zai_client.py`. It is
deliberately kept separate from any triage, delegation, or briefing logic so the
rest of the project can adapt it later.

It uses Z.AI's OpenAI-compatible chat completions endpoint:

- Base URL: `https://api.z.ai/api/paas/v4`
- Endpoint: `/chat/completions`
- Default model: `glm-5-turbo`

References: <https://docs.z.ai/guides/llm/glm-5-turbo> and
<https://docs.z.ai/guides/llm/glm-5.1>

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

## Classify Messages

Classify the sample inbox into `Ignore`, `Delegate`, and `Decide`:

```bash
cd backend
uv run aos-triage ../Messages.json
```

The CLI classifies in batches of 5 messages, disables thinking mode, and uses a
180 second request timeout by default. This avoids one slow full-inbox request
blocking the whole pipeline. Progress logs go to stderr, so redirecting stdout
still gives clean JSON:

```bash
cd backend
uv run aos-triage ../Messages.json > triage-results.json
```

If the API is still slow, reduce the batch size before raising the timeout:

```bash
cd backend
uv run aos-triage ../Messages.json --batch-size 3 --timeout 240 > triage-results.json
```

For a quick live smoke test:

```bash
cd backend
uv run aos-triage ../Messages.json --limit 3
```

To refresh the frontend with backend-processed triage data:

```bash
cd backend
uv run aos-refresh-frontend-triage
```

Avoid redirecting directly into `frontend/src/data/triageResults.json` while the
Next dev server is running; shell redirection temporarily empties the file before
the LLM call completes. The refresh command writes a temporary file and swaps it
into place only after valid JSON is ready.

The backend defaults to `glm-5-turbo` because it produced more reliable
structured output and slightly better latency in the sample benchmark. You can
still force another model when needed:

```bash
cd backend
uv run aos-triage ../Messages.json --model glm-5.1
```

Compare GLM 5.1 and GLM 5 Turbo latency and output quality:

```bash
cd backend
uv run aos-benchmark-models ../Messages.json --output benchmark-results.json
```

Generate the daily briefing from existing triage results:

```bash
cd backend
uv run aos-generate-briefing --triage triage-results.json --output daily-briefing.json
```

Refresh the frontend daily briefing artifact:

```bash
cd backend
uv run aos-refresh-frontend-briefing
```

## Manual Evaluation

Start with the small hand-labeled set in
`backend/evaluation/manual_triage_set.json`. It checks representative cases for:
investor decisions, phishing/noise, delegation, explicit sign-off, urgent
production risk, and calendar logistics.

Suggested review loop:

```bash
cd backend
uv run aos-triage ../Messages.json > triage-results.json
```

Then compare `triage-results.json` against
`evaluation/manual_triage_set.json`:

- Does the category match?
- Does `reason` explain the category in CEO-action terms?
- Is at least one evidence snippet copied directly from the message?
- Is the drafted response safe and realistic?
- Are uncertain or risky items surfaced instead of hidden?

## Run the Frontend

The CEO-facing web UI is a Next.js app in `frontend/`. Start the Python backend
API first if you want the **Regenerate** button in the draft composer to call
Z.AI:

```bash
cd backend
uv run aos-api
```

Then start the frontend in another terminal:

```bash
cd frontend
npm install
npm run dev
```

Then open <http://localhost:3000>. It ships with the provided `Messages.json`
data embedded so reviewers can see the dashboard immediately. Use **Load JSON**
in the top right to test another message file with the same array schema. The
browser-side analyzer provides an instant demo path, while `aos-triage` remains
the LLM-backed path for production-quality classifications.

## Example Usage in Future Backend Code

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
