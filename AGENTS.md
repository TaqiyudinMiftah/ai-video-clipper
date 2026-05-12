# AGENTS.md

## Project Name

AI Automation Video Clipper

## Main Goal

Build an MVP web application that allows users to submit videos, process them into short clips using OpusClip automation, store the resulting clips, and upload them to TikTok using Composio.

## Source of Truth

Always read and follow:

- docs/PROJECT_BRIEF.md

If there is a conflict between this file and PROJECT_BRIEF.md, ask for clarification or follow PROJECT_BRIEF.md.

## Development Style

- Implement incrementally.
- Do not build the entire project in one step unless explicitly asked.
- Prefer small, reviewable changes.
- Keep code modular.
- Use TypeScript.
- Use clear folder structure.
- Avoid overengineering.
- Add comments only when useful.
- Prefer simple working MVP code over complex abstractions.

## Tech Stack

Use:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- Redis
- BullMQ
- Playwright
- Composio
- Storage abstraction

## Architecture Rules

Separate the app into these modules:

- UI pages
- API routes
- Database layer
- Queue layer
- Worker layer
- Storage service
- OpusClip automation service
- Composio TikTok uploader service

Do not mix Playwright automation code directly into API routes.

Do not run long-running jobs directly inside HTTP request handlers.

API routes should create database records and enqueue jobs.

Workers should process long-running tasks.

## Security Rules

- Never hardcode secrets.
- Never commit real credentials.
- Use environment variables.
- Keep OAuth/API tokens server-side only.
- Do not expose service keys to frontend.
- Do not bypass CAPTCHA, rate limits, or anti-bot systems.
- Do not implement scraping beyond the minimum needed for the user-owned workflow.

## Playwright Rules

For OpusClip automation:

- Keep Playwright scripts inside workers or automation modules.
- Support saved browser session.
- Use stable selectors when possible.
- Save screenshot/logs on failure.
- Keep concurrency low.
- Make the module replaceable by a future OpusClip API integration.

## Composio Rules

For TikTok upload:

- Keep Composio integration in a dedicated service.
- Do not hardcode Composio API keys.
- Store upload status in database.
- Handle upload failure and retry.
- Keep YouTube and Instagram out of MVP unless explicitly requested.

## Testing Rules

When implementing code:

- Add minimal tests where practical.
- Add type checks.
- Run lint/build if available.
- If commands fail, explain the failure and suggest next steps.

## Output Expectations

For every completed task:

- Summarize what changed.
- List files changed.
- Mention commands that were run.
- Mention any unresolved issues.
- Do not pretend that unimplemented integrations are fully working.