import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import {
  buildSystemPrompt,
  buildUserContent,
  getAllowedTechniques,
  type PromptTechnique,
} from "@/lib/prompts";

const ALLOWED_PREP_TYPES = ["coding", "system-design", "algorithms"] as const;
const ALLOWED_DIFFICULTIES = ["easy", "medium", "hard"] as const;
const ALLOWED_MODELS = [
  "gpt-4.1-nano",
  "gpt-4o-mini",
  "gpt-3.5-turbo-16k",
] as const;
const DEFAULT_MODEL = "gpt-4o-mini";
const MAX_TOPIC_LENGTH = 500;
const MAX_JOB_DESCRIPTION_LENGTH = 3000;
const TEMPERATURE_MIN = 0;
const TEMPERATURE_MAX = 2;

/** OpenAI completion settings (tune for quality vs randomness). */
const DEFAULT_TEMPERATURE = 0.7; // untuned temperature is 1.0.  0.7 makes the model more focused / less random
const DEFAULT_MAX_TOKENS = 1024; // limit of response length

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * SECURITY GUARD: Validates the request body. Returns an error message or null if valid.
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
  const technique = parsedBody.technique;
  if (technique !== undefined && technique !== null) {
    if (typeof technique !== "string") return "technique must be a string.";
    const allowed = getAllowedTechniques();
    if (!allowed.includes(technique as PromptTechnique)) {
      return `Invalid technique. Use one of: ${allowed.join(", ")}.`;
    }
  }

  const model = parsedBody.model;
  if (model !== undefined && model !== null) {
    if (typeof model !== "string") return "model must be a string.";
    if (!ALLOWED_MODELS.includes(model as (typeof ALLOWED_MODELS)[number])) {
      return `Invalid model. Use one of: ${ALLOWED_MODELS.join(", ")}.`;
    }
  }

  const temperature = parsedBody.temperature;
  if (temperature !== undefined && temperature !== null) {
    if (typeof temperature !== "number" || Number.isNaN(temperature)) {
      return "temperature must be a number.";
    }
    if (temperature < TEMPERATURE_MIN || temperature > TEMPERATURE_MAX) {
      return `temperature must be between ${TEMPERATURE_MIN} and ${TEMPERATURE_MAX}.`;
    }
  }

  const jobDescription = parsedBody.jobDescription;
  if (jobDescription !== undefined && jobDescription !== null) {
    if (typeof jobDescription !== "string")
      return "jobDescription must be a string.";
    if (jobDescription.length > MAX_JOB_DESCRIPTION_LENGTH) {
      return `jobDescription must be at most ${MAX_JOB_DESCRIPTION_LENGTH} characters.`;
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

    const {
      prepType,
      difficulty,
      topic,
      technique,
      model,
      temperature: reqTemperature,
      jobDescription,
    } = body as {
      prepType: string;
      difficulty: string;
      topic?: string;
      technique?: PromptTechnique;
      model?: string;
      temperature?: number;
      jobDescription?: string;
    };
    const allowedTechniques = getAllowedTechniques();
    const effectiveTechnique: PromptTechnique =
      technique && allowedTechniques.includes(technique) ? technique : "base";
    const systemPrompt = buildSystemPrompt(
      prepType,
      difficulty,
      effectiveTechnique,
    );
    const userContent = buildUserContent(
      prepType,
      difficulty,
      topic?.trim(),
      jobDescription?.trim(),
    );

    const modelId =
      model && ALLOWED_MODELS.includes(model as (typeof ALLOWED_MODELS)[number])
        ? model
        : DEFAULT_MODEL;

    const effectiveTemperature =
      typeof reqTemperature === "number" &&
      !Number.isNaN(reqTemperature) &&
      reqTemperature >= TEMPERATURE_MIN &&
      reqTemperature <= TEMPERATURE_MAX
        ? reqTemperature
        : DEFAULT_TEMPERATURE;

    const completion = await openai.chat.completions.create({
      model: modelId,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: effectiveTemperature,
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
