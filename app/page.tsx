"use client";

import { useState } from "react";
import axios from "axios";
import {
  buildSystemPrompt,
  buildUserContent,
  getAllowedTechniques,
  type PromptTechnique as PromptTechniqueType,
} from "@/lib/prompts";

type PrepType = "coding" | "system-design" | "algorithms";
type Difficulty = "easy" | "medium" | "hard";
type PromptTechnique =
  | "base"
  | "zero-shot"
  | "few-shot"
  | "chain-of-thought"
  | "rubric";

const MODELS = [
  { value: "gpt-4.1-nano", label: "GPT-4.1 nano (smallest)" },
  { value: "gpt-4o-mini", label: "GPT-4o mini (medium)" },
  { value: "gpt-3.5-turbo-16k", label: "GPT-3.5 Turbo 16k (largest)" },
] as const;

export default function Home() {
  const [prepType, setPrepType] = useState<PrepType>("coding");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [technique, setTechnique] = useState<PromptTechnique>("base");
  const [model, setModel] = useState<string>("gpt-4o-mini");
  const [temperature, setTemperature] = useState(0.7);
  const [topic, setTopic] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Sends the form data to the prep API and shows the returned content or an error.
   * @param e - Form submit event
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResponse(null);
    setLoading(true);
    const payload = {
      prepType,
      difficulty,
      technique,
      model,
      temperature,
      topic: topic.trim() || undefined,
      jobDescription: jobDescription.trim() || undefined,
    };
    const allowedTechniques = getAllowedTechniques();
    const effectiveTechnique: PromptTechniqueType =
      technique && allowedTechniques.includes(technique) ? technique : "base";
    const systemPrompt = buildSystemPrompt(
      prepType,
      difficulty,
      effectiveTechnique,
    );
    const userContent = buildUserContent(
      prepType,
      difficulty,
      topic.trim() || undefined,
      jobDescription.trim() || undefined,
    );
    console.log(
      `--- Request (prompt sent to OpenAI) ---\nSystem prompt: ${systemPrompt}\nUser message: ${userContent}\nModel: ${model} | Temperature: ${temperature}\n--------------------------------------`,
    );
    try {
      const res = await axios.post<{ content?: string; message?: string }>(
        "/api/prep",
        payload,
      );
      const data = res.data;
      setResponse(data.content ?? data.message ?? "No content returned.");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data != null) {
        const msg =
          typeof err.response.data === "string"
            ? err.response.data
            : (err.response.data as { message?: string }).message;
        setError(msg ?? err.message);
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans">
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
          Interview Practice
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Technical prep: coding questions, system design, algorithms.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label
              htmlFor="prepType"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              What to practise
            </label>
            <select
              id="prepType"
              value={prepType}
              onChange={(e) => setPrepType(e.target.value as PrepType)}
              className="mt-1 block w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            >
              <option value="coding">Coding questions</option>
              <option value="system-design">System design</option>
              <option value="algorithms">Algorithms</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="technique"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Prompt style{" "}
              <span
                className="cursor-help text-xs font-normal text-zinc-500 dark:text-zinc-400"
                title={[
                  "Single question: one interview-style question (base).",
                  "Direct question (no examples): zero-shot prompt.",
                  "Question with examples: few-shot prompt using sample patterns.",
                  "Question with deeper reasoning: chain-of-thought; the model reasons internally but shows a concise question.",
                  "Feedback with rubric: rubric-style evaluation of an answer.",
                ].join("\n")}
              >
                (what&apos;s this?)
              </span>
            </label>
            <select
              id="technique"
              value={technique}
              onChange={(e) => setTechnique(e.target.value as PromptTechnique)}
              className="mt-1 block w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            >
              <option value="base">Single question</option>
              <option value="zero-shot">Direct question (no examples)</option>
              <option value="few-shot">Question with examples</option>
              <option value="chain-of-thought">
                Question with deeper reasoning
              </option>
              <option value="rubric">Feedback with rubric</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="difficulty"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Difficulty
            </label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="mt-1 block w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="topic"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Topic{" "}
              <span className="text-zinc-500 dark:text-zinc-500">
                (optional)
              </span>
            </label>
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Arrays, Binary trees, URL shortener"
              className="mt-1 block w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>

          <div>
            <label
              htmlFor="jobDescription"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Job description{" "}
              <span className="text-zinc-500 dark:text-zinc-500">
                (optional)
              </span>
            </label>
            <textarea
              id="jobDescription"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job posting to get tailored practice for this role."
              rows={4}
              className="mt-1 block w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>

          <div>
            <label
              htmlFor="temperature"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Temperature: {temperature}
            </label>
            <input
              id="temperature"
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              className="mt-1 block w-full accent-zinc-700 dark:accent-zinc-300"
            />
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Lower = more focused, higher = more varied responses.
            </p>
          </div>

          <div>
            <label
              htmlFor="model"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              AI Model
            </label>
            <select
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            >
              {MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? "Loading…" : "Get practice"}
          </button>
        </form>

        {(error || response) && (
          <section className="mt-8 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 sm:p-5">
            <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Response
            </h2>
            {error && (
              <p className="mt-2 text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            )}
            {response && !error && (
              <div className="mt-2 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                {response}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
