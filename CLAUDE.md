# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the AI Academic Paper Reviewer GitHub Action.

## Repository Overview

This is the **AI Academic Paper Reviewer** - a GitHub Action that provides AI-powered academic paper review functionality using Gemini AI. It's designed to help engineering faculty provide educational feedback on student papers.

## Key Purpose

### Primary Function
- **Academic Paper Review**: Automated review of student thesis/paper submissions
- **Educational Feedback**: Constructive feedback from engineering faculty perspective
- **Integration**: GitHub Action for seamless workflow integration

### Target Use Cases
- Student thesis review in engineering programs
- Academic paper quality assessment
- Educational feedback automation
- LaTeX/Markdown document review

## Repository Structure

```
ai-academic-paper-reviewer/
├── action.yml              # GitHub Action definition
├── src/                    # Core review logic
├── README.md              # English documentation
├── README.ja.md           # Japanese documentation
└── CLAUDE.md              # This file
```

## Key Technologies

### AI/ML Components
- **Gemini AI**: Google's generative AI for review analysis
- **Model**: gemini-2.5-flash (default)
- **Language Support**: Japanese/English review output

### Integration Features
- **GitHub Actions**: Automated PR review workflow
- **File Types**: LaTeX (.tex), Markdown (.md) support
- **Path Filtering**: Configurable include/exclude patterns

## Configuration Parameters

### Required Inputs
- `GEMINI_API_KEY`: Google AI Studio API key
- `GITHUB_TOKEN`: GitHub authentication token

### Optional Inputs
- `MODEL_CODE`: Gemini model selection
- `LANGUAGE`: Review language (Japanese/English)
- `EXCLUDE_PATHS`: File patterns to exclude
- `REVIEW_MODE`: ACADEMIC vs CODE review modes

## Academic Review Features

### Review Categories
- **CRITICAL (🚨)**: Major academic errors or logical contradictions
- **IMPORTANT (⚠️)**: Significant improvements needed
- **SUGGESTION (💡)**: Enhancement recommendations
- **PRAISE (✅)**: Recognition of good practices

### Review Focus Areas
- Scholarly accuracy and methodology
- Logical consistency and flow
- Research novelty and contribution
- Formal academic requirements
- Citation and reference quality

## Ecosystem Integration

### LaTeX Thesis Environment
This action is designed to integrate with the broader LaTeX thesis environment ecosystem:

- **sotsuron-template**: Undergraduate/graduate thesis templates
- **latex-environment**: Development environment setup
- **thesis-management-tools**: Administrative workflows

### Typical Workflow Integration
```yaml
# In student thesis repositories
name: "Academic Paper Review"
on:
  pull_request:
    paths:
      - 'thesis/**/*.tex'
      - 'thesis/**/*.md'

jobs:
  academic-review:
    runs-on: ubuntu-latest
    steps:
      - name: Academic Paper Review Bot
        uses: toshi0806/ai-academic-paper-reviewer@v1
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          LANGUAGE: "Japanese"
          REVIEW_MODE: "ACADEMIC"
```

## Development Guidelines

### Code Quality Standards
- Follow existing TypeScript/JavaScript conventions
- Maintain comprehensive error handling
- Ensure secure API key management
- Test with both Japanese and English content

### AI Review Quality
- Focus on educational value over criticism
- Provide constructive, actionable feedback
- Respect academic writing conventions
- Maintain consistency in review standards

## Usage Context

### Faculty Perspective
- Assists in providing consistent review feedback
- Reduces time spent on initial draft reviews
- Ensures comprehensive coverage of review criteria
- Maintains educational focus in feedback

### Student Perspective
- Provides immediate feedback on submissions
- Helps improve academic writing skills
- Offers structured improvement guidance
- Supports iterative improvement process

## Important Notes

- **Educational Tool**: Designed to supplement, not replace, faculty review
- **Privacy**: Ensure compliance with academic privacy requirements
- **API Costs**: Monitor Gemini API usage for cost management
- **Customization**: Adapt review criteria for specific academic programs

## Release / Versioning Policy

- Releases are **immutable** `vX.Y.Z` / `vX.Y` tags. **Do not** add a workflow
  that force-moves a shared major tag (`git tag -fa v1 && push --force`): every
  `@v1` consumer would silently receive new code, and the GitHub Actions tarball
  cache can then serve stale/inconsistent code (the hazard the ecosystem
  `CLAUDE.md` warns about). The old `release-updater.yml` mover was removed for
  this reason (smkwlab/.github#69, E-4).
- Consumers pin to a specific version tag (`@v1.9`) or a full commit SHA and let
  Dependabot bump it. Cut a **new** tag for each change — never re-push a
  published one.

## Security Considerations

- Secure handling of GEMINI_API_KEY
- Proper GitHub token permissions (pull-requests: write, contents: read)
- No storage of academic content in external systems
- Compliance with institutional data policies