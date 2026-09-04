# Claude session guidance

## Workflow: PR and merge without waiting

When work on a branch is complete and validated, open a pull request and
merge it to `main` yourself — do not hold the PR for pre-merge review. The
repository owner reviews asynchronously after merge and files issues for
anything to fix.

- Merge only when CI is green on the PR head. Use squash merge (matches the
  existing `main` history).
- Before pushing, `npm run check` must pass locally — it is the same gate CI
  runs (typecheck, lint, format, tests, `atlas-build --check`).
- Content rules live in `graph/schema.yaml` and are enforced by the
  validator; `ARCHITECTURE.md` §4.2 documents them. The validator is the
  review gate for content changes.

## Repository docs

Scope and success criteria: `SPECIFICATION.md` · design and formats:
`ARCHITECTURE.md` · sequencing: `ROADMAP.md` · provenance notebook:
`docs/notebook-v0.md`.
