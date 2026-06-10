import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the GitHub client so runReviewBotVercelAI runs without network. vi.mock is
// hoisted, so the mock fns must come from vi.hoisted to exist when the factory runs.
const { getMock, listFilesMock } = vi.hoisted(() => ({
    getMock: vi.fn(),
    listFilesMock: vi.fn(),
}));

vi.mock("@octokit/rest", () => ({
    Octokit: class {
        pulls = { get: getMock, listFiles: listFilesMock };
    },
}));

import { runReviewBotVercelAI } from "./index";

// Diff for a.ts → commentable new-file lines are {1,2,3,4} (added + context).
const PATCH = [
    "@@ -1,3 +1,4 @@",
    " context1",
    "-removed1",
    "+added1",
    "+added2",
    " context2",
].join("\n");

const baseArgs = {
    githubToken: "t",
    owner: "o",
    repo: "r",
    pullNumber: 1,
    excludePaths: [] as string[],
    language: "Japanese",
    modelCode: "claude-sonnet-4-6",
};

beforeEach(() => {
    getMock.mockReset().mockResolvedValue({ data: { title: "T", body: "B" } });
    listFilesMock
        .mockReset()
        .mockResolvedValue({ data: [{ filename: "a.ts", patch: PATCH }] });
});

describe("runReviewBotVercelAI inline hardening (#26)", () => {
    it("drops out-of-diff comments and folds them into the body", async () => {
        const post = vi.fn().mockResolvedValue(undefined);
        const generate = vi.fn().mockResolvedValue({
            body: "summary",
            comments: [
                { path: "a.ts", line: 2, body: "in-diff" },
                { path: "a.ts", line: 999, body: "out-of-diff" },
            ],
        });

        await runReviewBotVercelAI({
            ...baseArgs,
            generateReviewCommentFn: generate,
            postReviewCommentFn: post,
        });

        expect(post).toHaveBeenCalledTimes(1);
        const content = post.mock.calls[0][0].reviewCommentContent;
        // only the in-diff comment is posted inline
        expect(content.comments).toHaveLength(1);
        expect(content.comments[0].line).toBe(2);
        // the out-of-diff comment is preserved by folding it into the body,
        // under the language-appropriate (Japanese) heading
        expect(content.body).toContain("summary");
        expect(content.body).toContain("out-of-diff");
        expect(content.body).toContain("diff 範囲外");
    });

    it("posts normally when every comment is within the diff", async () => {
        const post = vi.fn().mockResolvedValue(undefined);
        const generate = vi.fn().mockResolvedValue({
            body: "summary",
            comments: [{ path: "a.ts", line: 3, body: "ok" }],
        });

        await runReviewBotVercelAI({
            ...baseArgs,
            generateReviewCommentFn: generate,
            postReviewCommentFn: post,
        });

        expect(post).toHaveBeenCalledTimes(1);
        const content = post.mock.calls[0][0].reviewCommentContent;
        expect(content.comments).toHaveLength(1);
        // nothing folded → no out-of-diff section
        expect(content.body).not.toContain("diff 範囲外");
    });

    it("falls back to a body-only summary when the inline post fails", async () => {
        const post = vi
            .fn()
            .mockRejectedValueOnce(new Error("422 line could not be resolved"))
            .mockResolvedValueOnce(undefined);
        const generate = vi.fn().mockResolvedValue({
            body: "summary",
            comments: [{ path: "a.ts", line: 2, body: "in-diff" }],
        });

        await runReviewBotVercelAI({
            ...baseArgs,
            generateReviewCommentFn: generate,
            postReviewCommentFn: post,
        });

        expect(post).toHaveBeenCalledTimes(2);
        const retry = post.mock.calls[1][0].reviewCommentContent;
        // retry carries no inline comments...
        expect(retry.comments).toHaveLength(0);
        // ...but folds the comment text into the body so nothing is silently lost
        expect(retry.body).toContain("in-diff");
    });
});
