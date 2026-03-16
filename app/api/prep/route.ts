import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_PREP_TYPES = ["coding", "system-design", "algorithms"] as const;
const ALLOWED_DIFFICULTIES = ["easy", "medium", "hard"] as const;
const ALLOWED_MODELS = [
  "gpt-4o-mini",
  "gpt-4o",
  "gpt-4.1",
  "gpt-4.1-mini",
  "gpt-4.1-nano",
] as const;
const DEFAULT_MODEL = "gpt-4o-mini";
const MAX_TOPIC_LENGTH = 500; // limit of "topic" input length

/** OpenAI completion settings (tune for quality vs randomness). */
const DEFAULT_TEMPERATURE = 0.7; // untuned temperature is 1.0.  0.7 makes the model more focused / less random
const DEFAULT_MAX_TOKENS = 1024; // limit of response length

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Builds the system prompt for the technical interviewer based on prep type and difficulty.
 * @param prepType - Type of prep: coding, system-design, or algorithms
 * @param difficulty - Difficulty level: easy, medium, or hard
 * @returns System prompt string for the LLM
 */
function buildSystemPrompt(prepType: string, difficulty: string): string {
  const base =
    "You are a technical interviewer helping someone practise for software engineering interviews. " +
    "Give clear, focused practice appropriate for the requested type and difficulty. " +
    "Do not answer off-topic or non-technical requests.";
  const typeGuidance: Record<string, string> = {
    coding:
      "Focus on coding problems: data structures, algorithms, and clean code. Provide one practice question or a short exercise.",
    "system-design":
      "Focus on system design: scalability, components, trade-offs. Provide a design prompt or discussion questions.",
    algorithms:
      "Focus on algorithms and complexity: suggest a problem or concept to practise, with hints if appropriate.",
  };
  const difficultyGuidance: Record<string, string> = {
    easy: "Keep it accessible; suitable for someone new to the topic.",
    medium: "Aim for mid-level depth; assume some prior knowledge.",
    hard: "Challenge with senior-level or interview-depth content.",
  };
  return [
    base,
    typeGuidance[prepType] ?? typeGuidance.coding,
    difficultyGuidance[difficulty] ?? difficultyGuidance.medium,
  ].join(" ");
}

/**
 * Validates the request body. Returns an error message or null if valid.
 * @param body - Parsed request body
 * @returns Error message or null
 */
function validateBody(body: unknown): string | null {
  if (body == null || typeof body !== "object") return "Invalid request body.";
  const parsedBody = body as Record<string, unknown>;
  const prepType = parsedBody.prepType;
  if (
    typeof prepType !== "string" ||
    !ALLOWED_PREP_TYPES.includes(
      prepType as (typeof ALLOWED_PREP_TYPES)[number],
    )
  ) {
    return "Invalid prepType. Use one of: coding, system-design, algorithms.";
  }
  const difficulty = parsedBody.difficulty;
  if (
    typeof difficulty !== "string" ||
    !ALLOWED_DIFFICULTIES.includes(
      difficulty as (typeof ALLOWED_DIFFICULTIES)[number],
    )
  ) {
    return "Invalid difficulty. Use one of: easy, medium, hard.";
  }
  const topic = parsedBody.topic;
  if (topic !== undefined && topic !== null) {
    if (typeof topic !== "string") return "topic must be a string.";
    if (topic.length > MAX_TOPIC_LENGTH)
      return `topic must be at most ${MAX_TOPIC_LENGTH} characters.`;
  }
  const model = parsedBody.model;
  if (model !== undefined && model !== null) {
    if (typeof model !== "string") return "model must be a string.";
    if (!ALLOWED_MODELS.includes(model as (typeof ALLOWED_MODELS)[number])) {
      return `Invalid model. Use one of: ${ALLOWED_MODELS.join(", ")}.`;
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey?.trim()) {
      return NextResponse.json(
        { message: "OpenAI API key is not configured." },
        { status: 500 },
      );
    }

    const body = await request.json();
    const validationError = validateBody(body);
    if (validationError) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    const { prepType, difficulty, topic, model } = body as {
      prepType: string;
      difficulty: string;
      topic?: string;
      model?: string;
    };
    const systemPrompt = buildSystemPrompt(prepType, difficulty);
    const userContent = topic?.trim()
      ? `I want to practise: ${prepType}, difficulty: ${difficulty}. Topic or focus: ${topic.trim()}.`
      : `I want to practise: ${prepType}, difficulty: ${difficulty}.`;

    const modelId =
      model && ALLOWED_MODELS.includes(model as (typeof ALLOWED_MODELS)[number])
        ? model
        : DEFAULT_MODEL;

    const completion = await openai.chat.completions.create({
      model: modelId,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: DEFAULT_TEMPERATURE,
      max_tokens: DEFAULT_MAX_TOKENS,
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json(
        { message: "No response from the model." },
        { status: 502 },
      );
    }

    return NextResponse.json({ content });
  } catch (err) {
    console.error("Prep API error:", err);
    const message = err instanceof Error ? err.message : "An error occurred.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
