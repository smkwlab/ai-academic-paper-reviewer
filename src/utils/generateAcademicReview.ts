import { generateText, generateObject, NoObjectGeneratedError } from "ai";
import { getModel, supportsTemperature } from "./provider";
import { z } from "zod";
import { GenerateReviewCommentFn, GenerateReviewCommentFnParams, ReviewCommentContent, withRetry } from "./index";

/**
 * 学術論文レビュー用のスキーマとアイコンマップ
 */
const academicCommentSchema = z.object({
    path: z
        .string()
        .describe(
            "Relative path to the file where the comment should be posted. Example: 'thesis/chapter2.tex' or 'paper/introduction.md'"
        ),
    body: z
        .string()
        .describe(
            "Specific and constructive feedback from an academic perspective. Include improvement suggestions from an educational viewpoint."
        ),
    line: z
        .number()
        .int()
        .positive()
        .describe(
            "The 1-based line number where the comment is placed. Corresponds to the new line number in the diff."
        ),
    priority: z
        .enum(["CRITICAL", "IMPORTANT", "SUGGESTION", "GOOD_POINT"])
        .describe(
            "Feedback priority. CRITICAL=major academic errors, IMPORTANT=significantly affects paper quality, SUGGESTION=improvement suggestions, GOOD_POINT=excellent sections"
        ),
    category: z
        .enum(["ACCURACY", "STRUCTURE", "NOVELTY", "FORMAT", "WRITING"])
        .describe(
            "Feedback category. ACCURACY=academic accuracy, STRUCTURE=organization, NOVELTY=research novelty, FORMAT=formal requirements, WRITING=language quality and readability"
        )
});

const academicReviewSchema = z.object({
    body: z
        .string()
        .describe(
            "Overall feedback for the entire paper. Include both areas for improvement and strengths."
        ),
    comments: z.array(academicCommentSchema),
    strengths: z.array(z.string()).describe("List of the paper's strengths"),
    improvements: z.array(z.string()).describe("List of main areas needing improvement")
});

// アイコンマップ（学術論文向け）
const academicIconMap = {
    "CRITICAL": "🚨",
    "IMPORTANT": "📝",
    "SUGGESTION": "💡",
    "GOOD_POINT": "✅"
} as const;

// カテゴリマップ（言語別）
const categoryMapJa = {
    "ACCURACY": "学術的正確性",
    "STRUCTURE": "構成",
    "NOVELTY": "新規性",
    "FORMAT": "形式",
    "WRITING": "文章品質"
} as const;

const categoryMapEn = {
    "ACCURACY": "Academic Accuracy",
    "STRUCTURE": "Structure",
    "NOVELTY": "Novelty",
    "FORMAT": "Format",
    "WRITING": "Writing Quality"
} as const;

// 優先度順序
const academicPriorityOrder = {
    "CRITICAL": 0,
    "IMPORTANT": 1,
    "SUGGESTION": 2,
    "GOOD_POINT": 999
} as const;


/**
 * 学術論文レビュー用のテキスト生成関数
 */
export const generateAcademicReviewText: GenerateReviewCommentFn = async (params) => {
    const { modelCode, userPrompt } = params;
    const { text } = await generateText({
        model: getModel(modelCode),
        prompt: userPrompt,
    });

    return { body: text };
};

/**
 * 学術論文レビュー用の構造化レビュー生成関数
 */
export const generateAcademicReviewObject: GenerateReviewCommentFn = async (params) => {
    const { modelCode, userPrompt } = params;

    // プロンプトから言語を判定（Japanese が含まれていれば日本語、それ以外は英語）
    const isJapanese = userPrompt.includes('Japanese');
    const categoryMap = isJapanese ? categoryMapJa : categoryMapEn;

    try {
        const { object } = await withRetry(
            async (attempt = 1) => {
                return await generateObject({
                    schema: academicReviewSchema,
                    model: getModel(modelCode),
                    prompt: userPrompt,
                    // Newer Anthropic models reject `temperature` (400); omit it there.
                    ...(supportsTemperature(modelCode)
                        ? { temperature: attempt === 1 ? 0 : 0.5 }
                        : {})
                });
            },
            {
                maxAttempts: 3,
                initialDelayMs: 2000,
                backoffFactor: 1.5,
                retryableError: (error) => {
                    return error instanceof NoObjectGeneratedError;
                },
                onRetry: (attempt, error) => {
                    console.log(`Retry attempt ${attempt} after error: ${error.message}`);
                }
            }
        );

        // 総合フィードバックの構築
        let overallBody = object.body;
        
        if (object.strengths && object.strengths.length > 0) {
            overallBody += "\n\n## 優れている点\n";
            object.strengths.forEach((strength, index) => {
                overallBody += `${index + 1}. ${strength}\n`;
            });
        }

        if (object.improvements && object.improvements.length > 0) {
            overallBody += "\n\n## 主な改善点\n";
            object.improvements.forEach((improvement, index) => {
                overallBody += `${index + 1}. ${improvement}\n`;
            });
        }

        return {
            body: overallBody,
            comments: object.comments
                .sort((a, b) => academicPriorityOrder[a.priority] - academicPriorityOrder[b.priority])
                .map((comment) => {
                    return {
                        path: comment.path,
                        body: `${academicIconMap[comment.priority]} [${comment.priority}] [${categoryMap[comment.category]}] ${comment.body}`,
                        line: comment.line
                    };
                }),
        };
    } catch (error) {
        console.log("Failed to generate structured academic review after all retries. Falling back to text generation.");
        return await generateAcademicReviewText(params);
    }
};