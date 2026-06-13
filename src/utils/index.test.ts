import { describe, it, expect } from "vitest";
import { parsePatch } from "diff";
import {
    collectValidCommentLines,
    createParsedDiffText,
    partitionCommentsByValidLines,
    renderCommentsAsBodySection,
} from "./index";

// A GitHub `listFiles` patch is headerless and starts at the first @@ hunk.
// Two hunks here exercise per-hunk newStart tracking and the +/-/context cases.
const PATCH = [
    "@@ -1,3 +1,4 @@",
    " context1",
    "-removed1",
    "+added1",
    "+added2",
    " context2",
    "@@ -10,2 +11,3 @@",
    " context10",
    "+added11",
    " context11",
].join("\n");

const parsedFile = (filename: string, patch: string) => ({
    filename,
    patch: parsePatch(patch),
});

describe("collectValidCommentLines", () => {
    it("includes added and context lines (new-file numbers), excludes removed lines", () => {
        const map = collectValidCommentLines([parsedFile("a.ts", PATCH)]);
        const lines = map.get("a.ts")!;
        // hunk1: context1=1, added1=2, added2=3, context2=4 ; removed1 has no new line
        // hunk2: context10=11, added11=12, context11=13
        expect([...lines].sort((x, y) => x - y)).toEqual([1, 2, 3, 4, 11, 12, 13]);
        // the removed-line's old number (2) must NOT be a valid new-side line here
        expect(lines.has(5)).toBe(false);
    });

    it("handles files with no patch as an empty set", () => {
        const map = collectValidCommentLines([{ filename: "empty.ts", patch: [] }]);
        expect(map.get("empty.ts")!.size).toBe(0);
    });

    it("ignores the 'No newline at end of file' marker", () => {
        const patch = ["@@ -1 +1 @@", "-old", "+new", "\\ No newline at end of file"].join("\n");
        const map = collectValidCommentLines([parsedFile("n.ts", patch)]);
        expect([...map.get("n.ts")!]).toEqual([1]); // only the added "new" line
    });
});

// Layout of a rendered diff row produced by createParsedDiffText:
// `<gutter><SEPARATOR><original diff line>`, where the gutter is a fixed-width
// "<old> <new>" pair (each right-aligned to NUM_WIDTH) so its second half holds
// the new-side number. These constants mirror that layout.
const NUM_WIDTH = 4;
const GUTTER_WIDTH = NUM_WIDTH + 1 + NUM_WIDTH; // "<old> <new>"
const SEPARATOR = " | ";

// Extract the new-side (RIGHT) line numbers that the AI-facing diff text
// presents as commentable: added (`+`) and context (` `) lines.
function commentableLinesFromDiffText(text: string): number[] {
    const nums: number[] = [];
    for (const row of text.split("\n")) {
        if (row.indexOf(SEPARATOR) !== GUTTER_WIDTH) continue;
        const gutter = row.slice(0, GUTTER_WIDTH);
        const marker = row.slice(GUTTER_WIDTH + SEPARATOR.length)[0];
        // Meta lines also reach here (their blank gutter is GUTTER_WIDTH wide),
        // but their marker is "\\", so they fall through this +/context filter.
        if (marker === "+" || marker === " ") {
            const right = gutter.slice(-NUM_WIDTH).trim(); // new-side number
            if (right) nums.push(Number(right));
        }
    }
    return nums.sort((a, b) => a - b);
}

describe("createParsedDiffText line numbering", () => {
    // A diff whose removed and added lines both lack a trailing newline, so the
    // parsed hunk interleaves "\ No newline at end of file" meta lines. The meta
    // lines must NOT advance the line counters, otherwise the numbers shown to
    // the AI drift past what collectValidCommentLines considers valid.
    const META_PATCH = [
        "@@ -1,2 +1,2 @@",
        " ctx",
        "-old",
        "\\ No newline at end of file",
        "+new",
        "\\ No newline at end of file",
    ].join("\n");

    it("does not let 'No newline' meta lines advance line numbers", () => {
        const text = createParsedDiffText([parsedFile("n.ts", META_PATCH)]);
        // ctx is new line 1, "new" is new line 2; meta lines carry no number.
        expect(commentableLinesFromDiffText(text)).toEqual([1, 2]);
    });

    it("matches collectValidCommentLines for a diff with meta lines", () => {
        const parsed = [parsedFile("n.ts", META_PATCH)];
        const valid = [...collectValidCommentLines(parsed).get("n.ts")!].sort(
            (a, b) => a - b
        );
        const shown = commentableLinesFromDiffText(createParsedDiffText(parsed));
        expect(shown).toEqual(valid);
    });

    it("matches collectValidCommentLines for a multi-hunk diff", () => {
        const parsed = [parsedFile("a.ts", PATCH)];
        const valid = [...collectValidCommentLines(parsed).get("a.ts")!].sort(
            (a, b) => a - b
        );
        const shown = commentableLinesFromDiffText(createParsedDiffText(parsed));
        expect(shown).toEqual(valid);
    });
});

describe("partitionCommentsByValidLines", () => {
    const validLines = collectValidCommentLines([parsedFile("a.ts", PATCH)]);

    it("keeps in-diff comments and rejects the rest", () => {
        const comments = [
            { path: "a.ts", line: 2, body: "in diff" },
            { path: "a.ts", line: 5, body: "outside hunk" },
            { path: "b.ts", line: 1, body: "unknown file" },
            { path: "a.ts", body: "no line" },
        ];
        const { valid, invalid } = partitionCommentsByValidLines(comments, validLines);
        expect(valid.map((c) => c.body)).toEqual(["in diff"]);
        expect(invalid.map((c) => c.body).sort()).toEqual(
            ["no line", "outside hunk", "unknown file"]
        );
    });

    it("returns all-valid when every comment is in the diff", () => {
        const comments = [
            { path: "a.ts", line: 1, body: "ctx" },
            { path: "a.ts", line: 12, body: "added in hunk2" },
        ];
        const { valid, invalid } = partitionCommentsByValidLines(comments, validLines);
        expect(valid).toHaveLength(2);
        expect(invalid).toHaveLength(0);
    });
});

describe("renderCommentsAsBodySection", () => {
    it("returns an empty string for no comments", () => {
        expect(renderCommentsAsBodySection([])).toBe("");
        expect(renderCommentsAsBodySection([], "Japanese")).toBe("");
    });

    it("renders a markdown list with path:line and body", () => {
        const out = renderCommentsAsBodySection([
            { path: "a.ts", line: 5, body: "msg" },
            { path: "a.ts", body: "no line" },
        ]);
        expect(out).toContain("could not be posted inline");
        expect(out).toContain("`a.ts:5` — msg");
        expect(out).toContain("`a.ts:?` — no line");
    });

    it("uses an English heading by default and for non-Japanese languages", () => {
        expect(renderCommentsAsBodySection([{ path: "a.ts", line: 5, body: "m" }])).toContain(
            "Comments outside the diff"
        );
        expect(
            renderCommentsAsBodySection([{ path: "a.ts", line: 5, body: "m" }], "English")
        ).toContain("Comments outside the diff");
    });

    it("uses a Japanese heading when the language is Japanese", () => {
        for (const lang of ["Japanese", "日本語"]) {
            const out = renderCommentsAsBodySection([{ path: "a.ts", line: 5, body: "m" }], lang);
            expect(out).toContain("diff 範囲外のため inline で投稿できなかったコメント");
            expect(out).not.toContain("Comments outside the diff");
        }
    });
});
