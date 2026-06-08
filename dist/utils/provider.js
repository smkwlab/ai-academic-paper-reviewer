"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveProvider = resolveProvider;
exports.apiKeyEnvName = apiKeyEnvName;
exports.getModel = getModel;
const google_1 = require("@ai-sdk/google");
const anthropic_1 = require("@ai-sdk/anthropic");
/**
 * Decide which provider to use for a given model code.
 *
 * An explicit `AI_PROVIDER` (or the `explicit` argument) wins; otherwise the
 * provider is inferred from the model code: Claude models (e.g.
 * `claude-sonnet-4-6`) use Anthropic, everything else uses Google (Gemini).
 */
function resolveProvider(modelCode, explicit = process.env.AI_PROVIDER) {
    const e = explicit === null || explicit === void 0 ? void 0 : explicit.trim().toLowerCase();
    if (e === "google" || e === "anthropic")
        return e;
    return /claude/i.test(modelCode) ? "anthropic" : "google";
}
/**
 * The env var holding the API key for the resolved provider. The Vercel AI SDK
 * reads these by default (`@ai-sdk/google` -> GOOGLE_GENERATIVE_AI_API_KEY,
 * `@ai-sdk/anthropic` -> ANTHROPIC_API_KEY).
 */
function apiKeyEnvName(provider) {
    return provider === "anthropic" ? "ANTHROPIC_API_KEY" : "GEMINI_API_KEY";
}
/** Build the Vercel AI SDK model for the resolved provider. */
function getModel(modelCode) {
    return resolveProvider(modelCode) === "anthropic"
        ? (0, anthropic_1.anthropic)(modelCode)
        : (0, google_1.google)(modelCode);
}
