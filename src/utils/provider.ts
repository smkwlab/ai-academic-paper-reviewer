import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";

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
export function getModel(modelCode: string): LanguageModel {
    return resolveProvider(modelCode) === "anthropic"
        ? anthropic(modelCode)
        : google(modelCode);
}

/**
 * Whether a model accepts the `temperature` sampling parameter.
 *
 * Newer Anthropic models removed `temperature` (along with `top_p` / `top_k`):
 * sending it returns a 400 ("`temperature` is deprecated for this model").
 * Affected: Claude Opus 4.7+ and Claude Fable 5+. Opus 4.6 and earlier,
 * Sonnet, Haiku, and all Google (Gemini) models still accept it.
 *
 * Ref: https://platform.claude.com/docs/en/about-claude/models/migration-guide
 */
export function supportsTemperature(modelCode: string): boolean {
    // Fable 5 and later removed sampling parameters entirely.
    const fable = modelCode.match(/fable-(\d+)/i);
    if (fable && Number(fable[1]) >= 5) return false;
    // Opus 4.7+ and Opus 5+ removed them too; Opus 4.6 and earlier still accept.
    const opus = modelCode.match(/opus-(\d+)-(\d+)/i);
    if (opus) {
        const [major, minor] = [Number(opus[1]), Number(opus[2])];
        if (major > 4 || (major === 4 && minor >= 7)) return false;
    }
    return true;
}
