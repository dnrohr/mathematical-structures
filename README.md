# The Structure Atlas

A typed knowledge graph of the mathematical structures and reusable moves
that recur across physics, engineering, biology, computation, and statistics
— plain files, compiled and validated by one boring build. Why it exists,
and what it refuses to be: [docs/mission.md](docs/mission.md).

**Status:** the dataset, the `atlas-build` compiler/validator, and the
reader app are live; the app deploys to GitHub Pages from `main`
([ROADMAP.md](ROADMAP.md) — graph views and the interactive symptom front
door are next).

## Using the atlas

The atlas is usable in three forms.

**Read it in the app.** The reader at
<https://dnrohr.github.io/mathematical-structures/> serves searchable
concept pages with dialect tables and typed, strength-labeled connection
sentences. Locally: `npm run build && npm run -w app preview`, or
`npm run build:data && npm run dev` for a live dev server.

**Read it as files.** Every concept is a Markdown page in
[`concepts/`](concepts/): front-matter carries the machine-readable node
(dialect names per field, assumptions, canonical examples), the body is
prose. Every cross-field claim is one typed, strength-labeled entry in
[`graph/edges.yaml`](graph/edges.yaml). To start from a problem instead of
a concept, [`graph/symptoms.yaml`](graph/symptoms.yaml) maps what your
problem *looks like* ("too many dimensional parameters") to the machinery
that has solved that shape elsewhere.

**Consume the compiled graph.** The build emits `graph.json` (nodes, edges,
rendered HTML, resolved links) and `search-index.json` — deterministic,
semver-versioned artifacts documented in
[docs/graph-json.md](docs/graph-json.md), meant for notebooks and external
tools as much as for the app.

```sh
# Node >= 20 (see .nvmrc)
npm install
npm run build         # full site into dist/ (artifacts at dist/data/)
npm run build:data    # just graph.json + search-index.json
```

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
                 # — the first gate CI runs on every push and PR; CI then
                 # builds the site and runs the Playwright smoke suite
```

The ground rules (slugs are permanent; every edge carries an honest
strength; vocabulary changes are schema changes) are in
[CONTRIBUTING.md](CONTRIBUTING.md), and
[docs/working-method.md](docs/working-method.md) describes how a concept
node gets written.

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
| The views the app will offer over the graph | [docs/views.md](docs/views.md) |
| The `graph.json` artifact format | [docs/graph-json.md](docs/graph-json.md) |
| Where the content came from | [docs/notebook-v0.md](docs/notebook-v0.md) |
