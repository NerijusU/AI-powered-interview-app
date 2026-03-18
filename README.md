# Interview Practice

A single-page web app for practising technical interviews (coding, system design, algorithms). The user configures parameters, starts a session, and has a multi-turn conversation with an AI interviewer powered by the OpenAI API.

**Live demo:** [https://ai-powered-interview-app-nu.vercel.app/](https://ai-powered-interview-app-nu.vercel.app/)

---

## For reviewers

This project implements the task described in **`115.md`**. Below is what was built and how to run it.

### Features implemented

| Requirement (115.md) | Implementation |
|----------------------|----------------|
| Single-page UI | Next.js App Router, one main page with settings + chat |
| User inputs (topic, difficulty, type) | Prep type (coding / system-design / algorithms), difficulty (easy/medium/hard), optional topic, optional job description |
| Call OpenAI with system prompt | `POST /api/prep` builds system + user prompts, calls Chat Completions API |
| At least 5 prompt techniques | Base, zero-shot, few-shot, chain-of-thought, rubric (see **Prompt style** in UI) |
| Tune at least one OpenAI setting | Temperature (0–2) configurable in UI; optional `max_tokens` in API |
| At least one security guard | Request validation in `app/api/prep/route.ts`: allowed enums, length limits, message count and content limits |
| Allowed models | gpt-4.1-nano, gpt-4o-mini (default), gpt-3.5-turbo-16k |

**Extra:** Multi-turn chat (start interview → send messages → reset), temperature slider, job description field, deployed on Vercel.

### Tech stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS, Axios
- **Backend:** Next.js API Route (`/api/prep`), OpenAI Node SDK
- **Package manager:** pnpm

### Getting started

1. **Prerequisites:** Node.js (LTS), pnpm (`npm install -g pnpm`).

2. **Install and run:**
   ```bash
   pnpm install
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

3. **Environment:** Create `.env.local` with:
   ```env
   OPENAI_API_KEY=sk-...
   ```
   Use `.env.example` as a template (key not committed).

### Project structure

| Path | Purpose |
|------|--------|
| `app/page.tsx` | Single page: parameter form, chat UI, start/reset/send message |
| `app/api/prep/route.ts` | POST handler: validation, prompt build, OpenAI call, JSON response |
| `lib/prompts.ts` | System/user prompt content and technique-specific variants |
| `115.md` | Full task description and requirements |
| `.cursor/rules/implementation-checklist.mdc` | Implementation checklist (for development) |

### API (POST /api/prep)

- **Body:** `prepType`, `difficulty`, `technique`, `model`, `temperature`, optional `topic`, `jobDescription`, optional `messages` (for multi-turn).
- **Response:** `{ content: string }` (assistant text) or `{ message: string }` (error).
- **Validation:** Enums and lengths enforced; invalid requests return 400 with a message.

### Task reference

- **Task spec:** See `115.md` for full requirements, optional tasks, and evaluation criteria.
- **Checklist:** See `.cursor/rules/implementation-checklist.mdc` for a tick-list of implemented items.
