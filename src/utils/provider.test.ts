import { describe, it, expect } from "vitest";
import { resolveProvider, apiKeyEnvName } from "./provider";

describe("resolveProvider", () => {
    it("honours an explicit provider (case-insensitive), overriding the model code", () => {
        expect(resolveProvider("models/gemini-2.5-flash", "anthropic")).toBe("anthropic");
        expect(resolveProvider("claude-sonnet-4-6", "google")).toBe("google");
        expect(resolveProvider("anything", "ANTHROPIC")).toBe("anthropic");
        expect(resolveProvider("anything", " Google ")).toBe("google");
    });

    it("infers anthropic from claude model codes", () => {
        expect(resolveProvider("claude-sonnet-4-6", "")).toBe("anthropic");
        expect(resolveProvider("claude-opus-4-8", "")).toBe("anthropic");
        expect(resolveProvider("CLAUDE-haiku", "")).toBe("anthropic");
    });

    it("defaults to google for non-claude codes and invalid explicit values", () => {
        expect(resolveProvider("models/gemini-2.5-flash", "")).toBe("google");
        expect(resolveProvider("models/gemini-2.0-flash", undefined)).toBe("google");
        expect(resolveProvider("some-other-model", "bogus")).toBe("google");
    });
});

describe("apiKeyEnvName", () => {
    it("maps each provider to its API key env var", () => {
        expect(apiKeyEnvName("anthropic")).toBe("ANTHROPIC_API_KEY");
        expect(apiKeyEnvName("google")).toBe("GEMINI_API_KEY");
    });
});
