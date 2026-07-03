[ENGLISH](./README.md) | [日本語](./README.ja.md)
# ai-academic-paper-reviewer

This is an AI-powered academic paper review bot using generative AI, designed to help engineering faculty provide educational feedback on student papers.

> **Based on [Nasubikun/ai-reviewer](https://github.com/Nasubikun/ai-reviewer)** - Extended for academic paper review functionality.

## Usage

Place a file (e.g., `ai-reviewer.yml`) in the `.github/workflows` directory with the following content:

```yaml
name: "Academic Paper Review"

permissions:
  pull-requests: write
  contents: read

on:
  pull_request:
    paths:
      - 'thesis/**/*.tex'
      - 'thesis/**/*.md'
      - 'paper/**/*.tex'
      - 'paper/**/*.md'
    types: [opened, synchronize, reopened]
  workflow_dispatch:

jobs:
  academic-review:
    runs-on: ubuntu-latest
    steps:
      - name: Academic Paper Review Bot
        # Pin to an immutable version tag (or a full commit SHA) — the
        # major tag is not force-moved, so `@v1` must not be relied on.
        uses: smkwlab/ai-academic-paper-reviewer@v1.9
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          LANGUAGE: "Japanese"
          EXCLUDE_PATHS: "*.bib,*.sty,*.cls,*.bbl,*.aux"
          MODEL_CODE: "models/gemini-2.5-flash-lite"
          REVIEW_MODE: "ACADEMIC"
```
Then, set your Google AI Studio Gemini API Key as GEMINI_API_KEY in your repository's GitHub Secrets.

## Versioning

Releases are published as **immutable** `vX.Y.Z` (and `vX.Y`) tags. The major
tag (`@v1`) is **not** force-moved to new releases, so consumers must not rely
on it silently tracking the latest code. Pin to a specific version tag such as
`@v1.9`, or to a full commit SHA, and let Dependabot bump it. This avoids the
stale/inconsistent GitHub Actions tarball cache that can result when a shared
tag is re-pushed.

## Features

- **Educational Feedback**: Provides constructive feedback from an experienced engineering faculty perspective
- **Academic Focus**: Reviews for scholarly accuracy, logical consistency, research novelty, and formal requirements
- **Priority Levels**: 
  - CRITICAL (🚨): Major academic errors or logical contradictions
  - IMPORTANT (📝): Issues significantly affecting paper quality
  - SUGGESTION (💡): Improvements to enhance the paper
  - GOOD_POINT (✅): Praise for excellent sections
- **Category Tags**: Feedback is categorized by aspect (Accuracy, Structure, Novelty, Format, Writing Quality)

## Configuration

You can fine-tune how reviews are performed by setting the following environment variables:

| Environment Variable               | Required      | Default Value                      | 	Description                                                                                                                                                           |
|--------------------------|------------|----------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **EXCLUDE_PATHS**        | false       | -                                | 	Specify file paths or directories to exclude from reviews, separated by commas. Example: `*.bib,*.sty,*.cls`<br>Files matching these paths will not be reviewed.                                    |
| **LANGUAGE**             | false       | `English`                        | Specifies the language of the AI-generated feedback (Example: `Japanese`, `English`).                                                                                                          |
| **MODEL_CODE**           | false       | `models/gemini-2.5-flash`    | The Gemini model to use. Please set a valid model code that is available in AI Studio.                                                                                             |
| **REVIEW_MODE**          | false       | `CODE`                           | Review mode: `ACADEMIC` for academic papers, `CODE` for code reviews.                                                                                              |
| **USE_SINGLE_COMMENT_REVIEW** | false | `false`                          | When set to true, posts all review results in a single comment with overall feedback. When false, posts line-specific comments.                                                              |

## Review Aspects for Academic Papers

The bot reviews papers from the following perspectives:

1. **Academic Accuracy and Logic**
   - Technical errors, logical leaps, unsupported claims
   - Appropriateness of equations, figures, and citations

2. **Paper Structure and Expression**
   - Introduction-body-conclusion organization
   - Paragraph structure and flow
   - Academic writing style and terminology

3. **Language Quality and Readability**
   - Grammar, syntax, and sentence structure
   - Clarity and conciseness of expression
   - Appropriate word choice and terminology
   - Consistency in writing style throughout the paper

4. **Research Novelty and Contribution**
   - Clear differentiation from existing research
   - Explanation of research significance and contributions

5. **Formal Requirements**
   - Citation format consistency
   - Figure and table numbering and captions
   - Completeness of reference list

## API Key Setup

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Get API key"
4. Copy the generated API key
5. Go to your GitHub repository Settings → Secrets and variables → Actions
6. Click "New repository secret"
7. Name: `GEMINI_API_KEY`, Value: your copied API key

## Supported File Formats

- LaTeX files (`.tex`)
- Markdown files (`.md`)

## Troubleshooting

### API Key Errors
- Verify `GEMINI_API_KEY` is correctly set in GitHub Secrets
- Check for typos in the API key
- Confirm the API key is active in Google AI Studio

### Review Not Running
- Verify file paths match trigger conditions
- Check if target files are excluded by `EXCLUDE_PATHS`
- Ensure GitHub Actions is enabled

## License

ISC License - see [LICENSE](LICENSE) file for details.