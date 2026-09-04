# The Structure Atlas

A graph-oriented field guide to the small set of mathematical structures and
intellectual moves that recur across physics, engineering, biology,
computation, and statistics — built for recognizing the abstract form of a
problem, not for taxonomizing disciplines.

The atlas is plain files compiled by one boring build:

- **[`concepts/`](concepts/)** — one Markdown file per node: summary, field
  dialects ("poles" ↔ "natural frequencies" ↔ "spectral gap"), assumptions,
  canonical examples, and prose. Slugs are permanent identifiers.
- **[`graph/edges.yaml`](graph/edges.yaml)** — the typed edge list: every
  cross-field claim as data, each with a relationship type and an honest
  strength from `identity` down to `speculative`. Research-gap hypotheses
  (`POSSIBLE-MISSING-MIGRATION`) carry a workflow status and are questions,
  never findings.
- **[`graph/symptoms.yaml`](graph/symptoms.yaml)** — the problem-recognition
  index: start from what your problem *looks like* ("too many dimensional
  parameters") and find the machinery that has solved that shape elsewhere.
- **[`graph/schema.yaml`](graph/schema.yaml)** — the single source of truth
  for every vocabulary: node types, edge types, strengths, fields, statuses.
- **[`docs/`](docs/)** — the
  [working method](docs/working-method.md), the
  [research-gap workflow](docs/research-gap-workflow.md), the
  [views catalogue](docs/views.md), and the format of the emitted
  [`graph.json`](docs/graph-json.md).

## Where things are decided

| Question | Document |
| --- | --- |
| What is this, for whom, and what counts as success? | [SPECIFICATION.md](SPECIFICATION.md) |
| File formats, build pipeline, validation rules, app design | [ARCHITECTURE.md](ARCHITECTURE.md) |
| What's done and what's next | [ROADMAP.md](ROADMAP.md) |
| How to contribute (the validator is the review gate) | [CONTRIBUTING.md](CONTRIBUTING.md) |

## Working with the data

```sh
npm install
npm run check        # typecheck, lint, tests, and full content validation
npm run atlas -- --out dist/data   # emit graph.json + search-index.json
```

`atlas-build` validates every concept file and edge against
`graph/schema.yaml` and fails loudly with the file and rule — malformed
content cannot merge. The emitted `graph.json` is a documented public
artifact ([docs/graph-json.md](docs/graph-json.md)) meant for notebooks and
external tools as much as for the app.

## Provenance

This project began as a single working notebook, preserved intact at
[docs/notebook-v0.md](docs/notebook-v0.md). Every concept file's `sections:`
front-matter points back to the notebook sections it was extracted from, so
no claim loses its paper trail.
