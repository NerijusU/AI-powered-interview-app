// Prompt techniques supported by the Interview Practice app.
const ALLOWED_TECHNIQUES = [
  "base",
  "zero-shot",
  "few-shot",
  "chain-of-thought",
  "rubric",
] as const;

// Base interviewer instructions shared across all techniques.
const BASE_CORE_PROMPT = [
  "You are a technical interviewer helping someone practise for software engineering interviews.",
  "You only answer questions related to technical interviews.",
  "Your answers must be clear and focused on practice.",
].join(" ");

// Extra guidance depending on the interview type (coding / system design / algorithms).
const TYPE_GUIDANCE: Record<string, string> = {
  coding:
    "Focus on coding problems: data structures, algorithms, and clean code. Provide one practice question or a short exercise.",
  "system-design":
    "Focus on system design: scalability, components, trade-offs. Provide a design prompt or discussion questions.",
  algorithms:
    "Focus on algorithms and complexity: suggest a problem or concept to practise, with hints if appropriate.",
};

// Extra guidance depending on the difficulty level.
const DIFFICULTY_GUIDANCE: Record<string, string> = {
  easy: "Keep it accessible; suitable for someone new to the topic.",
  medium: "Aim for mid-level depth; assume some prior knowledge.",
  hard: "Challenge with senior-level or interview-depth content.",
};

// Prompt Technique-specific suffixes appended to the common base prompt.
const ZERO_SHOT_SUFFIX = [
  "Use only the information in the user request and your own knowledge.",
  "Do not invent a backstory or ask follow-up questions.",
].join(" ");

const FEW_SHOT_SUFFIX = [
  "Here are example interactions you should imitate:",
  "",
  "Example 1 (coding):",
  "Interviewer: 'Given a sorted array of integers, return the index of a target value or -1 if not found.'",
  "Good follow-up: 'What is the time complexity of your approach?'",
  "",
  "Example 2 (system design):",
  "Interviewer: 'Design a URL shortener service.'",
  "Good follow-up: 'How would you handle a sudden spike in traffic?'",
].join("\n");

const CHAIN_OF_THOUGHT_SUFFIX = [
  "First, think through the problem step by step in your own mind.",
  "Then provide a concise final question or prompt for the candidate, without including your full internal reasoning in the response.",
].join(" ");

const RUBRIC_SUFFIX = [
  "You are evaluating a candidate's answer.",
  "Provide a short rubric with criteria such as correctness, clarity, efficiency, and trade-offs.",
  "Your response should help the candidate understand how to improve.",
].join(" ");

const BASE_SUFFIX = [
  "Ask one clear interview-style question or give one exercise.",
  "Keep the response focused and practical.",
].join(" ");

export type PromptTechnique = (typeof ALLOWED_TECHNIQUES)[number];

/**
 * List of supported prompt techniques.
 */
export function getAllowedTechniques(): readonly PromptTechnique[] {
  return ALLOWED_TECHNIQUES;
}

/**
 * Builds the system prompt for the technical interviewer based on prep type, difficulty, and technique.
 * @param prepType - Type of prep: coding, system-design, or algorithms
 * @param difficulty - Difficulty level: easy, medium, or hard
 * @param technique - Prompting technique to use (base, zero-shot, few-shot, chain-of-thought, rubric)
 * @returns System prompt string for the LLM
 */
export function buildSystemPrompt(
  prepType: string,
  difficulty: string,
  technique: PromptTechnique,
): string {
  const common = [
    BASE_CORE_PROMPT,
    TYPE_GUIDANCE[prepType] ?? TYPE_GUIDANCE.coding,
    DIFFICULTY_GUIDANCE[difficulty] ?? DIFFICULTY_GUIDANCE.medium,
  ].join(" ");

  switch (technique) {
    case "zero-shot":
      return [common, ZERO_SHOT_SUFFIX].join(" ");
    case "few-shot":
      return [common, FEW_SHOT_SUFFIX].join("\n\n");
    case "chain-of-thought":
      return [common, CHAIN_OF_THOUGHT_SUFFIX].join(" ");
    case "rubric":
      return [common, RUBRIC_SUFFIX].join(" ");
    case "base":
    default:
      return [common, BASE_SUFFIX].join(" ");
  }
}
