# Repository Guidelines

## Project structure & module organization
- `data/` houses product requirement docs grouped by vendor (for example `data/gpt-5/`); each folder must include both `prd.md` and `summary.md`.
- `src/` contains the evaluation tooling that renders and scores the documents; update TypeScript modules here when introducing new checks.
- `dist/` stores generated outputs and should not be edited manually—rebuild instead.
- Duplicate an existing vendor folder when starting new research runs and prune unused drafts with `rg --files data` to avoid strays.

## Build, test, and development commands
- `npm install` ensures markdown linting dependencies stay consistent.
- `npm run build` compiles the evaluator in `src/` to `dist/`.
- `npm test` runs the TypeScript unit tests and smoke-checks processing logic.
- `npx markdownlint-cli2 "data/**/*.md"` validates document formatting.
- `rg --files data` quickly lists vendor files to confirm placement before commits.

## Coding style & naming conventions
- Keep Markdown headings in sentence case with a single `#` title and `##` primary sections.
- Use unordered lists for acceptance criteria and numbered lists for flows; indent nested bullets with two spaces.
- Name vendor folders in lowercase kebab case (for example `data/sonnet-45/`); avoid dates or initials in filenames.
- Include fenced code blocks with language hints when quoting commands, payloads, or schema fragments.

## Testing guidelines
- Run `npm test` before pushing to confirm evaluator changes remain stable.
- Manually review metrics in `prd.md` files against upstream specs and note assumptions inline.
- Preview Markdown locally to verify anchors and external links still resolve.
- Execute `rg "TODO" data` to ensure no placeholders remain in shipped docs.

## Commit & pull request guidelines
- Use `docs: short imperative summary` commit messages (for example `docs: tighten telemetry guardrails`).
- Group related document edits per commit; keep structural rewrites separate from copy edits.
- PR descriptions should list touched vendor directories, link any tracking issues, and call out compliance-sensitive updates.
- Attach before/after references for external tables or diagrams so reviewers can verify the delta.

## Security & documentation handling
- Remove confidential datasets from drafts before uploading; link to secure storage instead.
- Note regional residency or compliance constraints explicitly when they differ from prior runs.
- Request a second reviewer for releases that adjust guardrails, telemetry, or privacy commitments.
