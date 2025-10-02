# Repository guidelines

## Project structure and module organization
- `data/` groups vendor runs (for example `data/gpt-5/`), and every folder must keep both `prd.md` and `summary.md` in sync with the latest evaluation brief.
- `src/promptfoo.config.ts` defines the judge roster, loads the rubric in `prd-job-interview.md`, and maps vendors listed in `modelDirectories` to their PRDs.
- `src/evalRunner.ts` compiles and executes the promptfoo run, normalises JSON coming back from each judge, and logs results into CSV and lite JSON summaries.
- `src/resultInterpreter.ts` reads the lite JSON output to produce human-readable score summaries for local use or GitHub Actions.
- `dist/` is build output only; regenerate it via the scripts below rather than editing files inside it.
- Use `rg --files data` before and after edits to confirm there are no stray drafts or duplicate vendor folders.

## Build, test, and development commands
- `npm install` keeps the TypeScript toolchain aligned with the versions committed in `package-lock.json`.
- `npm run build` compiles the TypeScript sources under `src/` into `dist/` and should stay clean before committing.
- `npm run eval` clears `dist/results`, rebuilds the project, disables the promptfoo cache, and runs `dist/evalRunner.js` to record a fresh multi-judge evaluation.
- `npm run display-scores` re-parses the latest lite JSON output and prints a Markdown table of judge scores—helpful for quick regression checks.
- `npx markdownlint-cli2 "data/**/*.md"` keeps the PRD markdown formatting consistent with lint rules.
- Prefer `rg` for repository searches (`rg --files data`, `rg "TODO" data`) to catch leftover stubs or mismatches efficiently.

## Coding style and naming conventions
- Keep Markdown headings in sentence case with a single `#` top-level title and `##` primary sections; use unordered lists for acceptance criteria and ordered lists for flows.
- Name vendor folders in lowercase kebab case (for example `data/sonnet-45/`) and avoid timestamps or initials in filenames.
- Document commands, payloads, and schema snippets inside fenced code blocks with language hints (` ```bash `, ` ```json `, etc.).
- TypeScript modules follow the existing pattern: prefer small helper functions with clear names and minimal inline comments unless a block needs clarification.

## Evaluation workflow
- Duplicate an existing vendor directory, update `prd.md` and `summary.md`, and add the folder name to `modelDirectories` in `src/promptfoo.config.ts` when onboarding a new run.
- Ensure `.env` (not committed) carries API keys for every provider in use: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, and `OPENROUTER_API_KEY` are required by the current config.
- Running `npm run eval` writes `dist/results/latest.json`, `dist/results/latest.lite.json`, and appends to `dist/results/score-history.csv`; check these artifacts instead of editing them manually.
- Use `npm run display-scores` after an evaluation to sanity-check averages and confirm judge aliases resolved as expected.

## Testing guidelines
- There is no dedicated `npm test` script yet; treat `npm run build` plus a full `npm run eval` (with `npm run display-scores`) as the regression safety net until tests are added.
- Manually compare PRD metrics in each `prd.md` against upstream specs and note any assumptions or deviations inline.
- Preview Markdown locally to confirm anchors and external references still work, and run `rg "TODO" data` before shipping docs.

## Commit and pull request guidelines
- Use `docs: short imperative summary` commit messages (for example `docs: tighten telemetry guardrails`).
- Group related document edits per commit and separate structural rewrites from copy edits to keep diffs reviewable.
- PR descriptions should list the vendor directories touched, link to any tracking issues, and flag changes that might affect compliance or guardrails.
- When updating external tables or diagrams, attach before/after references so reviewers can verify deltas quickly.

## Security and documentation handling
- Strip confidential datasets from drafts before committing and point to secured storage locations instead.
- Call out regional residency or compliance requirements explicitly when they diverge from prior runs.
- Surface changes to guardrails, telemetry, or privacy commitments early and request a second reviewer for those releases.
