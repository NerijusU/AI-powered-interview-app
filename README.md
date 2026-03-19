# Interview Practice

A single-page web app for practising technical interviews (coding, system design, algorithms). The user configures parameters, starts a session, and has a multi-turn conversation with an AI interviewer powered by the OpenAI API.

**Live demo:** [https://ai-powered-interview-app-nu.vercel.app/](https://ai-powered-interview-app-nu.vercel.app/)

---

## For reviewers

### Task requirements

❗ - 1. Research the exact nature of interview preparation you want to do. This is intentional, as we want you to explore and get creative!

✅ - **Implementation**: Technical interview preparation app focusing on coding questions, system design, and algorithms.

❗ - 2. Figure out how you are going to build the front-end.

✅ - **Implementation**: Next.js 16 (App Router) + React 19 + Tailwind CSS + Axios.

❗ - 3. Create an OpenAI API Key for this project.

✅ - **Implementation**: OpenAI API key created and saved in `.env.local`.

```env
 OPENAI_API_KEY=sk-...
```

❗ - 4. Choose one of the following OpenAI models for the project.

✅ - **Implementation**: Supports `gpt-4.1-nano`, `gpt-4o-mini` (default), and `gpt-3.5-turbo-16k`, selectable in the UI and defined in `app/api/prep/route.ts`.

<details>
  <summary>See source snippet from <code>app/api/prep/route.ts</code></summary>

```ts
const ALLOWED_MODELS = [
  "gpt-4.1-nano",
  "gpt-4o-mini",
  "gpt-3.5-turbo-16k",
] as const;
const DEFAULT_MODEL = "gpt-4o-mini";
```

</details>

❗ - 5. Write at least 5 system prompts with different techniques.

✅ - **Implementation**: Five prompt techniques implemented in `lib/prompts.ts` and exposed via the **Prompt style** selector: base, zero-shot, few-shot, chain-of-thought, and rubric.

<details>
  <summary>See source snippet from <code>lib/prompts.ts</code></summary>

```ts
const ALLOWED_TECHNIQUES = [
  "base",
  "zero-shot",
  "few-shot",
  "chain-of-thought",
  "rubric",
] as const;
```

</details>

❗ - 6. Tune at least one OpenAI setting.

✅ - **Implementation**: `temperature` is user-configurable and passed to the OpenAI API.

<details>
  <summary>See source snippet from <code>app/page.tsx</code></summary>

```ts
const [temperature, setTemperature] = useState(0.7);
```

```tsx
<input
  id="temperature"
  type="range"
  min={0}
  max={2}
  step={0.1}
  value={temperature}
  onChange={(e) => setTemperature(Number(e.target.value))}
/>
```

</details>

❗ - 7. Add at least one security guard to your app to prevent misuse.

✅ - **Implementation**: Server-side validation in `app/api/prep/route.ts`:

- Enforces allowed enums and numeric bounds (`temperature`).
- Caps conversation history (`messages`) to 50 items.
- Validates each message (`role` must be `user`/`assistant`, `content` must be a non-empty string <= 8192 chars).
- Returns `400` with an error message for invalid requests.
- current implementation does **not** automatically summarize or truncate older chat turns, but relies on the guards above.

<details>
  <summary>See source snippet from <code>app/api/prep/route.ts</code></summary>

```ts
if (!Array.isArray(messages)) return "messages must be an array.";
if (messages.length > MAX_CONVERSATION_MESSAGES) {
  return `messages must have at most ${MAX_CONVERSATION_MESSAGES} items.`;
}
// ... validate each message role/content ...
if (content.length > MAX_MESSAGE_CONTENT_LENGTH) {
  return `messages[${i}].content must be at most ${MAX_MESSAGE_CONTENT_LENGTH} characters.`;
}
```

</details>

### Optional tasks

### Easy

❗ - 4. Simulate different difficulty levels – Adjust the complexity of interview questions (easy, medium, hard).

✅ - **Implementation**: `Difficulty` dropdown (`easy` / `medium` / `hard`) in `app/page.tsx`, included in the OpenAI system prompt.

<details>
  <summary>See source snippet from <code>app/page.tsx</code></summary>

```tsx
<select id="difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
  <option value="easy">Easy</option>
  <option value="medium">Medium</option>
  <option value="hard">Hard</option>
</select>
```

</details>

### Medium

❗ - 3. Deploy your app to the Internet.

✅ - **Implementation**: Deployed on Vercel.

❗ - 7. Add a separate text field or another field to include the job description (the position) you are applying for and getting interview preparation for that particular position.

✅ - **Implementation**: `jobDescription` textarea in the settings panel; sent to the API and included in the user content.

<details>
  <summary>See source snippet from <code>app/page.tsx</code></summary>

```tsx
<textarea
  id="jobDescription"
  value={jobDescription}
  onChange={(e) => setJobDescription(e.target.value)}
/>
```

</details>

❗ - 8. Provide the user with the ability to choose from a list of LLMs.

✅ - **Implementation**: AI model dropdown in the settings panel.

<details>
  <summary>See source snippet from <code>app/page.tsx</code></summary>

```ts
const MODELS = [
  { value: "gpt-4.1-nano", label: "GPT-4.1 nano (smallest)" },
  { value: "gpt-4o-mini", label: "GPT-4o mini (medium)" },
  { value: "gpt-3.5-turbo-16k", label: "GPT-3.5 Turbo 16k (largest)" },
] as const;
```

</details>

### Hard

❗ - 1. Using Streamlit (Python) or React (JS) components, implement a full-fledged chatbot application instead of a one-time call to the OpenAI API.

✅ - **Implementation**: Multi-turn conversation workflow (send follow-ups with the `messages` array; `Reset interview` clears chat history and starts fresh).

<details>
  <summary>See source snippet from <code>app/page.tsx</code></summary>

```ts
function buildPayload(conversationMessages?: ChatMessage[]) {
  return {
    // ...other fields...
    ...(conversationMessages &&
      conversationMessages.length > 0 && { messages: conversationMessages }),
  };
}

function handleReset() {
  setMessages([]);
}
```

</details>
