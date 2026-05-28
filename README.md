# Innate AoS

AI Chief of Staff take-home assessment.

This app lets a CEO upload a message JSON file, triage every message with Z.AI,
and review the inbox as a progressively updating daily brief.

## What It Does

- Upload a JSON inbox file from the web UI.
- Classify each message as `Ignore`, `Delegate`, or `Decide`.
- Stream completed triage batches into the UI while later batches are still processing.
- Show the reason and evidence behind each classification.
- Generate a daily briefing and risk flags after all messages are triaged.
- Open a draft reply composer for each message.
- Regenerate draft replies through the backend LLM API.

## Requirements

- Python 3.10+
- [uv](https://docs.astral.sh/uv/)
- Node.js 20+
- npm
- A Z.AI API key

The backend uses Z.AI's OpenAI-compatible chat completions API:

- Base URL: `https://api.z.ai/api/paas/v4`
- Default model: `glm-5-turbo`

## Setup

Install backend dependencies:

```bash
cd backend
uv sync
cp .env.example .env
```

Add your Z.AI API key to `backend/.env`:

```bash
ZAI_API_KEY=your-zai-api-key
ZAI_MODEL=glm-5-turbo
ZAI_BASE_URL=https://api.z.ai/api/paas/v4
ZAI_TIMEOUT_SECONDS=180
```

Install frontend dependencies:

```bash
cd ../frontend
npm install
```

Return to the project root:

```bash
cd ..
```

## Run The App

Use two terminals so the backend and frontend logs stay easy to read.

Terminal 1, start the backend API:

```bash
cd backend
uv run aos-api
```

Terminal 2, start the frontend:

```bash
cd frontend
npm run dev
```

Then open the app:

```text
http://localhost:3000
```

The backend runs on `http://127.0.0.1:8000`, and the frontend runs on
`http://localhost:3000`.

## End-To-End Test Flow

1. Open `http://localhost:3000`.
2. Click `Load JSON`.
3. Select the root-level `Messages.json` file.
4. Watch message rows appear as pending.
5. As each backend batch finishes, completed triage cards replace pending rows.
6. Wait for the daily briefing and flags to finish after all messages are triaged.
7. Click `Details` on a message to inspect reason and evidence.
8. Click `Draft Reply` to open the floating reply composer.
9. Click `Regenerate` to call the backend draft endpoint.
10. Click `Send` to close the composer with a simulated send confirmation.

## Useful Commands

Run backend tests only:

```bash
cd backend
uv run python -m unittest discover -s tests
```

Run frontend checks only:

```bash
cd frontend
npm run typecheck
npm run lint
npm run build
```

Run the backend API:

```bash
cd backend
uv run aos-api
```

Run the frontend:

```bash
cd frontend
npm run dev
```

## Project Layout

```text
backend/
  src/aos/          Python backend, Z.AI client, triage, briefing, draft APIs
  tests/            Backend unit tests
frontend/
  src/              Next.js frontend
Messages.json       Sample inbox for end-to-end testing
```

## Notes

- Triage runs in batches of 4 messages to reduce timeout risk and improve
  perceived latency.
- Daily briefing and flags are generated only after all message batches finish,
  because they need the full inbox context.
- The `Send` button is intentionally simulated for this assessment version.
