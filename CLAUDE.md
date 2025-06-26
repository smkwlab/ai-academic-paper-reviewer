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
- **Model**: gemini-2.0-flash (default)
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

## Security Considerations

- Secure handling of GEMINI_API_KEY
- Proper GitHub token permissions (pull-requests: write, contents: read)
- No storage of academic content in external systems
- Compliance with institutional data policies

## Security and Permission Guidelines

### 🚨 CRITICAL: GitHub Administration Rules

#### Git and GitHub Operations
- **NEVER use `--admin` flag** with `gh pr merge` or similar commands
- **NEVER bypass Branch Protection Rules** without explicit user permission
- **ALWAYS respect the configured workflow**: approval process, status checks, etc.

#### When Branch Protection Blocks Operations
1. **Report the situation** to user with specific error message
2. **Explain available options**:
   - Wait for required approvals
   - Wait for status checks to pass
   - Use `--auto` flag for automatic merge after requirements met
   - Request explicit permission for admin override (emergency only)
3. **Wait for user instruction** - never assume intent

#### Proper Error Handling Example
```bash
# When this fails:
gh pr merge 90 --squash --delete-branch
# Error: Pull request is not mergeable: the base branch policy prohibits the merge

# CORRECT response:
echo "Branch Protection Rules prevent merge. Options:"
echo "1. Wait for required approvals (currently need: 1)"
echo "2. Wait for status checks (currently pending: build-and-release-pdf)"
echo "3. Use --auto to merge automatically when requirements met"
echo "4. Request admin override (emergency only)"
echo "Please specify how to proceed."

# WRONG response:
gh pr merge 90 --squash --delete-branch --admin  # NEVER DO THIS
```

#### Emergency Admin Override
- Only use `--admin` flag when explicitly requested by user
- Document the reason for override in commit/PR description
- Report the action taken and why it was necessary

### Rationale
Branch Protection Rules exist to:
- Ensure code quality through required reviews
- Prevent accidental breaking changes
- Maintain audit trail of changes
- Enforce consistent development workflow

Bypassing these rules undermines repository security and development process integrity.