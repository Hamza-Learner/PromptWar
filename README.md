# ScamShield — Fake Offer Letter & Phishing Inspector

Single-page security scanner that inspects job offer text and URLs, performs RDAP domain
forensics, and computes a dynamic **Scam Threat Index (0–100%)** using Gemini AI.

> Built for **PromptWars x Gen AI Club** (Hack2Skill × Google for Developers).

---

## What It Does

1. **AI Text Analysis (Gemini, server-side)** — detects advance-fee payment demands,
   urgency pressure, company/domain mismatch, generic greetings, grammar anomalies,
   and missing official contact details.
2. **Domain Forensics (RDAP)** — registration age, registrar, suspicious TLDs
   (`.xyz`, `.top`, …), brand impersonation/typosquatting, and SSL checks.
3. **Dynamic Scam Threat Index** — weighted flags (0–100) mapped to risk bands:
   `0–30 Low` · `31–70 Medium` · `71–100 High`, each with actionable recommendations.
4. **Extras** — scan history (localStorage), JSON/PDF report export, dark/light/system themes,
   accessible keyboard-first UI.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Tailwind CSS 4 (Vite) |
| Backend | Node.js + Express (single server, SPA + API) |
| AI | Gemini via `@google/genai` (server-side only) |
| Domain intel | Public RDAP (`rdap.org`) |
| Storage | `localStorage` (scan history, theme) — no PII leaves the browser |
| Design | Google Stitch design reference in [`design-reference/`](./design-reference) |

## Run Locally

```bash
npm install
# Set your key in .env.local (never commit it):
#   GEMINI_API_KEY=<your key from Google AI Studio>
npm run dev        # http://localhost:3000
```

Without a key the app **degrades gracefully** to a rule-based heuristic engine
(`fallbackUsed: true`) — no crash, no blank screen.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server (Vite middleware + API on :3000) |
| `npm test` | Vitest unit tests (scoring, validators, history) |
| `npm run lint` | TypeScript strict check (`tsc --noEmit`) |
| `npm run build` | Production build (`dist/` + bundled server) |
| `npm start` | Serve production build (Cloud Run entrypoint) |

## Architecture

```
browser ──POST /api/scan──▶ Express ──▶ validateInput() ──▶ Gemini (text) / RDAP (domain)
   │                             │
   └─ ResultCard ◀── ScanResult ◀┘  (threat score, flags, recommendations)
```

- `server/api.ts` — `/api/scan`, `/api/health`, in-memory rate limit (10 scans/min/IP)
- `server/gemini-handler.ts` — strict-JSON Gemini call + heuristic fallback
- `server/domain-inspector.ts` — RDAP lookup with 6s timeout, age/TLD/brand scoring
- `src/utils/constants.ts` — single source of truth for scoring weights & thresholds
- `src/services/scanner.ts` — client orchestration + offline fallback

## Security Practices

- **API key never reaches the browser** — Gemini is called server-side only; the key is read
  from `process.env.GEMINI_API_KEY` (AI Studio Secrets / Cloud Run env).
- All user input is sanitized (`<script>`/tag stripping) and length-capped (5,000 chars).
- No `dangerouslySetInnerHTML` anywhere; React escaping only.
- Rate limiting per IP; structured 4xx/5xx responses without leaking internals.

## Deployment (Google Cloud Run)

Published through **Google AI Studio → Publish** (Cloud Run). Set `GEMINI_API_KEY`
in the AI Studio **Secrets** panel — never in code.

## Disclaimer

ScamShield is an assistive risk-evaluation tool, not legal or law-enforcement advice.
Never pay any fee for a job offer. India: cybercrime.gov.in / helpline **1930** · US: ic3.gov.

