# The Structure Atlas

A typed knowledge graph of the mathematical structures and reusable moves
that recur across physics, engineering, biology, computation, and statistics
— plain files, compiled and validated by one boring build. Why it exists,
and what it refuses to be: [docs/mission.md](docs/mission.md).

**Read it live: <https://dnrohr.github.io/mathematical-structures/>** —
searchable concept pages with per-field dialect tables, typed
strength-labeled connections, graph lenses, translation-chain finding, and
the open-questions pipeline. v1 (all
[SPECIFICATION.md](SPECIFICATION.md) §11 criteria met) as of tag `v1.0.0`;
every merge to `main` deploys.

## Using the atlas

The atlas is usable in three forms.

**Read it in the app.** Start from what your problem *looks like* (the
symptom cards), or press <kbd>/</kbd> and search any field's word for a
concept — "poles", "perfect adaptation", "explained variance" all resolve
to their canonical structure. Locally: `npm run build && npm run -w app
preview`, or `npm run build:data && npm run dev` for a live dev server.
Press <kbd>?</kbd> in the app for all keyboard shortcuts.

**Read it as files.** Every concept is a Markdown page in
[`concepts/`](concepts/): front-matter carries the machine-readable node
(dialect names per field, assumptions, canonical examples), the body is
prose. Every cross-field claim is one typed, strength-labeled entry in
[`graph/edges.yaml`](graph/edges.yaml). To start from a problem instead of
a concept, [`graph/symptoms.yaml`](graph/symptoms.yaml) maps symptoms to
the machinery that has solved that shape elsewhere.

**Consume the compiled graph.** The build emits `graph.json` (nodes, edges,
rendered HTML, resolved links, build-time metrics) plus GraphML and CSV
exports and `search-index.json` — deterministic, semver-versioned
artifacts, **stable at 1.x**, documented in
[docs/graph-json.md](docs/graph-json.md) and downloadable from the app's
Metrics and Questions views.

```sh
# Node >= 20 (see .nvmrc)
npm install
npm run build         # full site into dist/ (artifacts at dist/data/)
npm run build:data    # just the data artifacts
```

## How to read the map

The visual grammar is semantic and identical everywhere — badges, lists,
and graph views (the legend below is the whole of it):

- **Node color = ontological class.** One hue per node type (object,
  operation, model, principle, phenomenon, move, theorem, dialect,
  application), shown as the dot beside every concept link and the badge on
  every page. Color never carries meaning alone — the type name is always
  written out.
- **Edge style = epistemic strength.** Solid for `identity`/`theorem`,
  dashed for `special-case`/`strong-analogy`, dotted for
  `heuristic-analogy`/`speculative` — with a text badge on every rendered
  claim. The map's central discipline is that an attractive analogy must
  not masquerade as an identity.
- **Flagged, never blended:** research-gap hypotheses
  (`POSSIBLE-MISSING-MIGRATION`) render in a warning style with their
  verification status, and are excluded from metrics and default path
  chains until verified.
- **Every graph is also text.** Anything a graph view shows exists as a
  readable claim sentence on the same page; hover or focus an edge to read
  it.

## Repository layout

| Path | Contents |
| --- | --- |
| [`concepts/`](concepts/) | one Markdown file per node; slugs are permanent identifiers |
| [`graph/schema.yaml`](graph/schema.yaml) | the single source of truth for every vocabulary: node types, edge types, strengths, fields, statuses |
| [`graph/edges.yaml`](graph/edges.yaml) | the typed edge list |
| [`graph/symptoms.yaml`](graph/symptoms.yaml) | the problem-recognition index |
| [`build/`](build/) | `atlas-build`, the compiler/validator (TypeScript, Node) |
| [`app/`](app/) | the reader SPA (Vite + vanilla TS; reads only the build artifacts) |
| [`paths/`](paths/) | reserved for guided walks (post-v1) |
| [`docs/`](docs/) | mission, method docs, artifact format, the original notebook |
| `dist/` | build output (gitignored) |

## Contributing

Content changes are ordinary pull requests, and **the validator is the
review gate**: `atlas-build` checks every concept file and edge against
`graph/schema.yaml` and fails loudly with the file and rule — malformed
content cannot merge.

```sh
npm run check    # typecheck + lint + format + tests + content validation
                 # — the first gate CI runs; CI then builds the site,
                 # enforces the JS budget, and runs the Playwright suite
```

[CONTRIBUTING.md](CONTRIBUTING.md) has the ground rules (slugs are
permanent; every edge carries an honest strength; vocabulary changes are
schema changes) and step-by-step walkthroughs for adding a node or an
edge. Not ready for a PR? There are issue templates for proposing a node,
an edge, or a research-gap hypothesis.

## Where things are decided

| Question | Document |
| --- | --- |
| Why does this exist, and what does it refuse to be? | [docs/mission.md](docs/mission.md) |
| What is this, for whom, and what counts as success? | [SPECIFICATION.md](SPECIFICATION.md) |
| File formats, build pipeline, validation rules, app design | [ARCHITECTURE.md](ARCHITECTURE.md) |
| What's done and what's next | [ROADMAP.md](ROADMAP.md) |
| How to contribute | [CONTRIBUTING.md](CONTRIBUTING.md) |
| How a concept node gets written | [docs/working-method.md](docs/working-method.md) |
| How a research-gap hypothesis gets verified | [docs/research-gap-workflow.md](docs/research-gap-workflow.md) |
| The views the app offers over the graph | [docs/views.md](docs/views.md) |
| The `graph.json` artifact format (stable, 1.x) | [docs/graph-json.md](docs/graph-json.md) |
| Where the content came from | [docs/notebook-v0.md](docs/notebook-v0.md) |
