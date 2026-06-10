import { describe, it, expect } from "vitest";
import { resolveProvider, apiKeyEnvName, supportsTemperature } from "./provider";

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

describe("supportsTemperature", () => {
    it("returns false for newer Anthropic models that removed sampling params", () => {
        expect(supportsTemperature("claude-opus-4-7")).toBe(false);
        expect(supportsTemperature("claude-opus-4-8")).toBe(false);
        expect(supportsTemperature("CLAUDE-OPUS-4-8")).toBe(false);
        expect(supportsTemperature("claude-fable-5")).toBe(false);
    });

    it("returns false for future Anthropic versions on the same trajectory", () => {
        expect(supportsTemperature("claude-opus-4-9")).toBe(false); // future Opus 4.x
        expect(supportsTemperature("claude-opus-5-0")).toBe(false); // future Opus 5+
        expect(supportsTemperature("claude-fable-6")).toBe(false); // future Fable
    });

    it("returns true for older Anthropic models that still accept temperature", () => {
        expect(supportsTemperature("claude-opus-4-6")).toBe(true);
        expect(supportsTemperature("claude-opus-4-5")).toBe(true);
        expect(supportsTemperature("claude-sonnet-4-6")).toBe(true);
        expect(supportsTemperature("claude-haiku-4-5")).toBe(true);
    });

    it("returns true for Google (Gemini) models", () => {
        expect(supportsTemperature("models/gemini-2.5-flash")).toBe(true);
        expect(supportsTemperature("models/gemini-2.0-flash")).toBe(true);
    });
});
