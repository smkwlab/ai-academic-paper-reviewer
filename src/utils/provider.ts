import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import type { LanguageModelV1 } from "ai";

export type AIProvider = "google" | "anthropic";

/**
 * Decide which provider to use for a given model code.
 *
 * An explicit `AI_PROVIDER` (or the `explicit` argument) wins; otherwise the
 * provider is inferred from the model code: Claude models (e.g.
 * `claude-sonnet-4-6`) use Anthropic, everything else uses Google (Gemini).
 */
export function resolveProvider(
    modelCode: string,
    explicit: string | undefined = process.env.AI_PROVIDER,
): AIProvider {
    const e = explicit?.trim().toLowerCase();
    if (e === "google" || e === "anthropic") return e;
    return /claude/i.test(modelCode) ? "anthropic" : "google";
}

/**
 * The env var holding the API key for the resolved provider. The Vercel AI SDK
 * reads these by default (`@ai-sdk/google` -> GOOGLE_GENERATIVE_AI_API_KEY,
 * `@ai-sdk/anthropic` -> ANTHROPIC_API_KEY).
 */
export function apiKeyEnvName(provider: AIProvider): string {
    return provider === "anthropic" ? "ANTHROPIC_API_KEY" : "GEMINI_API_KEY";
}

/** Build the Vercel AI SDK model for the resolved provider. */
export function getModel(modelCode: string): LanguageModelV1 {
    return resolveProvider(modelCode) === "anthropic"
        ? anthropic(modelCode)
        : google(modelCode);
}
