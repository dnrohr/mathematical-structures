# Architecture: The Structure Atlas

This document expands §7 of [SPECIFICATION.md](SPECIFICATION.md) into a concrete
technical architecture. The specification says *what* and *why*; this document says
*how* — file formats, pipeline stages, data contracts, module boundaries, and the
decisions that hold them together. Where this document makes a choice the
specification left open, the choice is recorded in the decision log (§10).

---

## 1. System overview

Three layers, one-way data flow, one data contract between each pair:

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   CONTENT LAYER     │     │    BUILD LAYER      │     │     APP LAYER       │
│                     │     │                     │     │                     │
│  concepts/*.md      │ ──► │  parse              │ ──► │  static SPA         │
│  graph/edges.yaml   │     │  validate (fail     │     │  (GitHub Pages)     │
│  graph/schema.yaml  │     │    loudly)          │     │                     │
│  graph/symptoms.yaml│     │  link & render      │     │  reads exactly:     │
│  paths/*.yaml       │     │  analyze (metrics)  │     │   graph.json        │
│  docs/              │     │  emit               │     │   search-index.json │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
      plain files              deterministic               no network calls
      edited in git            Node CLI, CI-run            beyond first load
```

Hard rules that define the layer boundaries:

- The app never reads content files. Its only inputs are the build artifacts.
- The build never contains UI knowledge. It does not know what a "page" is.
- The content layer never contains derived data. Anything computable (metrics,
  backlinks, rendered HTML, search index) is computed by the build, so the source
  files stay small, diffable, and honest.
- Every artifact the build emits carries a `schema_version`. The app refuses data
  with a major version it does not understand, and says so on screen rather than
  rendering garbage.

## 2. Repository layout

```
/
├── README.md                  # front door: usage, contributing, navigation (slim)
├── SPECIFICATION.md           # product spec
├── ARCHITECTURE.md            # this file
├── concepts/                  # one file per node
│   ├── eigenvalues.md
│   ├── taylor-expansion.md
│   └── ...
├── graph/
│   ├── schema.yaml            # controlled vocabularies (single source of truth)
│   ├── edges.yaml             # the typed edge list
│   ├── symptoms.yaml          # the problem-recognition index
│   ├── non-edges.yaml         # the reject ledger: reviewed non-connections (M11)
│   └── references.bib         # the literature that edges cite (M8)
├── paths/                     # guided walks (spec §8.3), one YAML file per walk (M9)
├── docs/                      # working method, research-gap workflow, notes
├── build/                     # the compiler/validator (TypeScript, Node)
│   ├── src/
│   │   ├── parse.ts
│   │   ├── validate.ts
│   │   ├── link.ts
│   │   ├── analyze.ts
│   │   ├── emit.ts
│   │   └── index.ts           # CLI entry: atlas-build [--check] [--out DIR]
│   └── test/
├── app/                       # the SPA source
│   ├── index.html             # Vite entry
│   ├── vite.config.ts         # base './', outDir ../dist, dev middleware for /data
│   ├── e2e/                   # Playwright smoke suite (spec §11 journeys)
│   ├── test/                  # unit tests (data accessors, schema↔style token gate)
│   └── src/
│       ├── shell/             # routing, search, theme, keyboard, layout
│       ├── views/             # one directory per route + views/common/ fragments
│       ├── graph-render/      # the one shared graph component (lands in M4)
│       ├── style/             # semantic style module (the only color definitions)
│       └── data/              # typed loaders for graph.json / search-index.json
├── dist/                      # build output (gitignored; CI artifact)
└── .github/workflows/
    ├── ci.yml                 # validate + test on every push/PR
    └── deploy.yml             # build + Pages deploy on main
```

One runtime: **Node ≥ 20, TypeScript everywhere** (build and app share types).
No server code exists anywhere in the repository.

## 3. Content layer

### 3.1 Identity: slugs are the primary key

Every node has a `slug` — lowercase, hyphenated, stable forever (`eigenvalues`,
`state-space-model`). The slug is the filename (`concepts/<slug>.md`), the edge
endpoint reference, the URL fragment (`#/c/eigenvalues`), and the join key across
every artifact. Renaming a concept means changing `canonical_name` (display) while
the slug persists; actually changing a slug requires touching every referencing edge,
and the validator enforces that no dangling reference survives. This is deliberate
friction: identity churn is the classic wiki failure mode.

### 3.2 Concept files: `concepts/<slug>.md`

YAML front-matter carries the machine-readable node (spec §7.1, README §33); the
Markdown body carries the prose. Complete example:

```markdown
---
canonical_name: Eigenvalues and spectral decomposition
node_type: operation            # from schema.yaml node_types
status: established             # established | analogy | hypothesis | stub
fields: [control, mechanics, probability, graphs, statistics, quantum, pde]
summary: >
  Which directions, patterns, or modes are preserved by an operator
  except for a change of scale?
aliases:
  - name: poles / modes / damping
    field: control
  - name: natural frequencies / mode shapes
    field: mechanics
  - name: stationary mode / spectral gap / mixing
    field: probability
  - name: principal components / explained variance
    field: statistics
  - name: eigenstates / spectrum
    field: quantum
assumptions:
  - linearity                   # free text, or a slug when the assumption has a node
  - diagonalizability (else Jordan/defective cases)
canonical_examples:
  - Coupled oscillators decoupling into normal modes
  - Transition-matrix eigenvalue 1 giving the stationary distribution
sections:                       # provenance back to the original notebook
  - readme#12-eigenvalues-and-spectral-decomposition
---

A matrix may strongly mix the coordinates in which a problem was originally
stated... (Markdown body; standard $..$ / $$..$$ math; links to other concepts
written as [[state-space-model]] wiki-links.)
```

Body conventions the build understands:

- `[[slug]]` and `[[slug|display text]]` wiki-links → validated, rendered as app
  links, and harvested to power "mentioned by" backlinks. Prose links are *not*
  edges — an edge is a deliberate typed claim in `edges.yaml`; a wiki-link is mere
  navigation. The build reports wiki-linked pairs with no edge between them as an
  info-level "candidate edge" list, which is how casual linking feeds the curation
  queue without polluting the graph.
- Math is written in standard TeX delimiters and rendered to KaTeX HTML **at build
  time**, so the client ships no TeX parser and pages render instantly.

### 3.3 Edges: `graph/edges.yaml`

A flat list, one entry per claim, reviewable as a set (deliberately not embedded in
node files — a relationship claim belongs to both endpoints and to neither file):

```yaml
- from: linear-gaussian-ssm
  to: state-space-model
  type: IS-A
  strength: theorem             # identity | theorem | special-case |
                                # strong-analogy | heuristic-analogy | speculative
  context: exact; no distributional caveats

- from: classical-stability-margins
  to: biological-regulation
  type: POSSIBLE-MISSING-MIGRATION
  strength: speculative
  status: open-candidate        # research-gap workflow state (spec §5.5)
  notes: >
    Meaningful only where a linearization regime and I/O definition exist;
    see docs/research-gap-workflow.md before promoting.
  evidence: [del-vecchio-murray-2015] # citation keys into references.bib (§3.6)

- from: impulse-response
  to: greens-function
  type: FIELD-DIALECT-OF      # a symmetric type; symmetry always comes
  strength: identity          # from the edge type, never per-edge
```

`type` must exist in `schema.yaml`; unknown types fail the build. Symmetric types
(e.g. `FIELD-DIALECT-OF`, `ANALOGOUS-TO`) are declared symmetric *in the schema*,
and the validator rejects a redundant reversed duplicate.

### 3.4 Vocabularies: `graph/schema.yaml`

The single current version of the ontology the README kept re-drafting. It defines:
`node_types` (with display name and semantic color token), `edge_types` (with
directionality, display phrasing for both directions — "special case of" /
"generalized by" — and line-style token), `strengths` (ordered, with line-weight
token), `fields`, and `statuses`. Changing the ontology is a one-file diff, and the
validator makes every content file comply or the build fails. **No other file may
define a vocabulary value.**

### 3.5 Symptoms: `graph/symptoms.yaml`

The problem-recognition index as data:

```yaml
- id: too-many-parameters
  symptom: Too many dimensional parameters
  moves: [dimensional-analysis, pca-svd, nondimensionalization, perturbation-theory]
  mature_fields: [fluids, heat-transfer, reaction-engineering]
  worked_example: reynolds-number
```

Each `moves` entry must be an existing node slug. Symptoms are content, not derived
data: deciding what counts as a symptom is curation, not computation.

### 3.6 References: `graph/references.bib`

The literature behind the map's checkable claims (spec §8.2, M8). A strict
BibTeX subset — concrete entries only, values as plain UTF-8 display text
(no @string/@preamble, no `#` concatenation, no TeX escapes), keys
lowercase-kebab author(s)-year (`kak-slaney-1988`, `west-etal-1997`):

```bibtex
@book{kak-slaney-1988,
  author    = {Kak, Avinash C. and Slaney, Malcolm},
  title     = {Principles of Computerized Tomographic Imaging},
  publisher = {IEEE Press},
  year      = {1988},
}
```

Edges cite entries by key from their `evidence` lists. The coupling is
validated both ways: an evidence key with no entry is an error (a citation
that points nowhere is worse than none), an entry cited by no edge is an
info-level curation hint, and every entry needs at least a `title` and
`year`. The file is optional — an atlas without citations is valid; the
strength vocabulary, not the bibliography, carries the epistemic weight.

### 3.7 Walks: `paths/<id>.yaml`

Guided walks through the graph (spec §8.3, M9) — ordered tours a reader
steps through, with the connecting claims shown along the way. One YAML
file per walk; **the id is the filename** (lowercase-kebab, permanent),
exactly like concept slugs (§3.1):

```yaml
# paths/eigenvalue-tour.yaml
title: The eigenvalue tour
summary: >
  One question — which patterns does an operator preserve? — walked
  through five fields' vocabularies.
steps:
  - slug: eigenvalues
    note: Start at the hub; every later stop is this question in costume.
  - slug: harmonic-oscillator
    note: Normal modes are the mechanics dialect of the same decomposition.
  - slug: markov-chains
    note: >
      No single edge makes this hop — the walk jumps across the hub we
      just left (§34 chain 1 runs normal modes ↔ relaxation modes through
      eigenvalues) into the probability dialect.
```

Each step is `{slug, note?}`: `slug` must be an existing concept, `note`
is the "why this step" line the walk view shows beside the stop. Walks are
content, not derived data: choosing the stops and telling the story is
curation. The connecting typed edges are *not* stored in the file — the
app looks them up, so a walk can never contradict the edge list. Where two
consecutive steps have **no** typed edge between them (either direction),
the later step's `note` is **required** and must say why the walk jumps;
the validator enforces this, so every hop is either a claim from
`edges.yaml` or an explicit, honest bridge — never an implied connection
the graph does not make (spec §1).

### 3.8 Non-edges: `graph/non-edges.yaml`

The reject ledger (UI_REDESIGN.md §4.6, M11): a reviewed decision **not** to
connect a pair is data, so the decision is never re-litigated and the work
queue never re-asks it. One flat, optional list:

```yaml
- between: [kalman-filter, hidden-markov-model]  # unordered; both must exist
  reason: >-                                     # required: why the pair
    The Kalman filter is an algorithm, not a     # stays unconnected
    model class (notebook §8); the containment
    runs through linear-gaussian-ssm.
  see: linear-gaussian-ssm                       # optional: a concept slug or
                                                 # an http(s) URL
```

The validator checks both endpoints exist, requires the reason, and —
the epistemic rule — **errors when any typed edge connects a recorded
pair**: the ledger and the edge list may never contradict each other. The
build suppresses a recorded pair's candidate-edge and link-suggestion queue
items, and emits the ledger into `graph.json` as `non_edges`, where the
queue view renders it as "deliberate non-connections" — for this project,
*"we checked, and these are false friends"* is content, not bookkeeping.

## 4. Build layer

A single CLI (`atlas-build`) with deterministic output (same input → byte-identical
artifacts; object keys sorted, no timestamps) so `dist/` diffs are meaningful in CI.
Five stages, each a pure function over the previous stage's output:

### 4.1 Parse

Read every content file into typed in-memory records. Front-matter parsing errors,
malformed YAML, and TeX that KaTeX rejects are collected — the build reports **all**
errors in one run rather than dying at the first, because content authors fix
batches.

### 4.2 Validate

The dataset's test suite. Severity levels: **error** (build fails), **warn**
(reported, build passes), **info** (curation hints). Initial rule set:

| Rule | Severity |
| --- | --- |
| Edge endpoint slug does not exist | error |
| Edge/node uses a value missing from schema.yaml | error |
| Duplicate slug, duplicate edge (same from/to/type), reversed duplicate of a symmetric edge | error |
| Wiki-link to a nonexistent slug | error |
| Missing required front-matter field (per status: a `stub` needs less than an `established` node) | error |
| `speculative` strength without a `status` from the gap workflow | error |
| `POSSIBLE-MISSING-MIGRATION` with strength stronger than `heuristic-analogy` | error |
| Orphan node (no edges, no incoming wiki-links) | warn |
| Node with no aliases in a multi-field concept (`fields` ≥ 3) | warn |
| Symptom referencing a `stub` node | warn |
| `application` node with < 2 distinct structure neighbors over APPLIED-IN / MIGRATED-TO edges (spec §8.8's bar) | warn |
| `evidence` key with no `references.bib` entry, or cited twice on one edge | error |
| Malformed `references.bib` entry (syntax, unsupported construct, bad/duplicate key, missing title/year) | error |
| Walk step slug that is not an existing concept | error |
| Consecutive walk steps with no typed edge between them and no bridging `note` on the later step | error |
| Walk with a repeated step, or fewer than two steps | error |
| Walk step on a `stub` node | warn |
| Non-edge endpoint that is not an existing concept, self-pair, duplicate pair, or missing `reason` | error |
| Non-edge contradicted by a typed edge between the same pair (either direction) | error |
| Non-edge `see` pointer that is neither a concept slug nor an http(s) URL | error |
| Wiki-linked pair with no edge (candidate edge; suppressed when the pair is in `non-edges.yaml`) | info |
| Reference cited by no edge | info |

The warn rules encode the spec's priorities (dialects, curation, the
application bar) as machine checks. New rules are added here, never as
conventions in people's heads.

### 4.3 Link

Resolve wiki-links, compute backlinks, group each node's edges by type and
direction (using the schema's two-way display phrasings), attach symptom
memberships, and render Markdown+TeX bodies to sanitized HTML. Output: the complete
denormalized node records the app will consume.

### 4.4 Analyze

Compute the README §33 derived metrics over the typed graph, entirely at build time
(the client never runs graph algorithms):

- **Degree** and **betweenness centrality** (Brandes; the graph is small).
  Betweenness runs on the subgraph of `strength ≥ special-case` edges so that
  speculative analogies cannot manufacture fake bridges — an epistemic rule, not
  just a technical one.
- **Community detection** (Louvain/Leiden) on the same trusted subgraph, emitted as
  a partition label per node, for the "does the graph rediscover the disciplines?"
  view.
- **Disciplinary span entropy**: Shannon entropy over each node's `fields` list
  (upgrade path: weighted usage if the schema later grades field usage).
- **Dialect count**: distinct fields represented in `aliases`.
- **Candidate-edge and gap summaries**: the info-level validator output, plus all
  `POSSIBLE-MISSING-MIGRATION` edges with their workflow status, packaged for the
  Open Questions view.
- **Work-queue signals** (`metrics.queue`, M11; UI_REDESIGN.md §4.6) — plain,
  explainable math only, every item carrying its evidence: link suggestions
  (unconnected pairs with ≥ 2 shared trusted neighbors, witnesses listed;
  existing edges and `non-edges.yaml` pairs excluded), bridge deficits
  (community pairs joined by ≤ 1 trusted edge, the bridging edge named),
  recurring assumptions (the identical normalized free-text `assumptions`
  string on ≥ 2 nodes; slug-valued strings are typed references, not
  signals), dialect gaps (a field in `fields` with no alias, on nodes with
  ≥ 2 dialects), and thin symptoms (< 2 moves or no worked example).

### 4.5 Emit

Artifacts written to `dist/data/`:

- **`graph.json`** — `{ schema_version, generated_from: <git sha>, schema, nodes[],
  edges[], symptoms[], references[], walks[], metrics }`. Nodes embed their rendered HTML. Target scale
  (hundreds of nodes) keeps this well under a megabyte gzipped; if body HTML ever
  dominates, the escape hatch is splitting bodies into per-node
  `dist/data/nodes/<slug>.json` fetched on demand — the loader interface in
  `app/src/data/` is written against that possibility now.
- **`search-index.json`** — a prebuilt MiniSearch index over canonical names,
  aliases (weighted highest — reverse-dialect lookup is search's primary job),
  summaries, and symptom text.
- The app's static assets copied alongside, yielding a fully self-contained
  `dist/` deployable to any static host.

`atlas-build --check` runs stages 1–2 only; it is the PR gate and the fast local
loop.

## 5. App layer

### 5.1 Technology choices

Per the spec's "boring infrastructure" principle: **no SPA framework**. Vanilla
TypeScript with small, pinned libraries where they genuinely pay:
`minisearch` (client search over the prebuilt index), `d3-force` + hand-written SVG
for graph rendering, KaTeX **CSS/fonts only** (rendering happened at build time).
Hash-based routing (`#/...`) so GitHub Pages needs no rewrite rules. Vite for dev
server and bundling. Total JS budget: under 200 KB gzipped excluding data.

Rationale: the app is a reader over immutable data — no forms, no mutations, no
shared mutable state. Framework reactivity solves problems this app does not have,
and a dependency-light SPA is the version most likely to still build in ten years,
matching the "can never rot" deployment goal.

### 5.2 Routing

```
#/                      landing: symptom index + search (?s=<id> highlights a symptom)
#/c/<slug>              concept page (?at=dialects lands at the dialect table — the map's row headers)
#/moves                 index of node_type=move (spec §5.2)
#/index                 A–Z index — the plain fallback when search isn't the tool
#/dialects?q=...        reverse-dialect lookup
#/lens?edge=...&type=...&field=...&strength=...   composed subgraph view
#/matrix?order=…&edge=…&type=…&field=…&strength=…&focus=…&a=…&b=…
                        adjacency matrix: every pair incl. absence; focus = crosshair,
                        a/b = the open pair panel (M12, UI_REDESIGN §4.3)
#/map?order=…&field=…&focus=…   structures × fields migration map (M12, UI_REDESIGN §4.4)
#/path/<slugA>/<slugB>  translation-chain finder
#/metrics               hubs, bridges, span/dialect rankings
#/questions             open research-gap candidates
#/queue                 the work queue: mechanical curation signals + the reject ledger
                        (M11; ?bridge=<a>-<b> highlights one deficit item — the matrix's
                        empty-block links land there)
#/walks                 index of guided walks (spec §8.3)
#/walk/<id>?step=<n>    one walk, stepped through; position in the URL
#/propose?from=<slug>&to=<slug>&type=…&strength=…&context=…
                        propose-an-edge composer → prefilled GitHub issue (M10)
```

Every view's full state lives in the URL — filters included — so any screen is
shareable and citable by link, which the Researcher persona requires.

### 5.3 Module structure and dependency rules

```
shell ──► views ──► graph-render
  │         │            │
  └────► data ◄──────────┘          style ◄── (everyone)
```

- **`data/`**: loads and validates artifacts, exposes typed read-only accessors
  (`getNode(slug)`, `edgesFor(slug)`, `pathsBetween(a, b, filters)`); the only
  module allowed to touch fetched JSON. Path-finding (bounded-depth BFS over the
  filtered edge set) lives here — it is the one graph computation done client-side,
  because it depends on user-chosen filters.
- **`views/`**: one directory per route; each renders DOM from `data/` accessors.
  Views never import each other; shared fragments (edge-sentence renderer, dialect
  table, strength badge) live in `views/common/`.
- **`graph-render/`**: exactly one force-layout SVG component with three presets
  (ego, lens, path). It receives pre-filtered nodes/edges and emits navigation
  events; it never queries data itself.
- **`style/`**: the semantic style module — CSS custom properties for node-type
  hues, edge-strength line grammar (solid/dashed/dotted + weight), status badges,
  and the light/dark theme definitions. **The only file in the app where a color
  literal may appear.** Both build (for any static rendering) and app import the
  same token names, keyed to `schema.yaml` tokens, so a new node type added to the
  schema fails compilation until it gets a visual identity — the spec's "visual
  grammar has exactly one definition" made mechanical.
- **`shell/`**: hash router, global search (`/` focuses; results ranked
  alias-first), theme toggle (respecting `prefers-color-scheme`), keyboard
  navigation (arrow-hop through a concept page's edge list).

### 5.4 Rendering and accessibility

Concept bodies are pre-rendered sanitized HTML injected into the page; wiki-links
are real `<a href="#/c/...">` anchors, so middle-click, hover previews, and crawlers
all work. The graph SVG is decoration-plus-shortcut, never the only path: every
relationship shown in a graph view is also present as text (the edge-sentence
list), which is simultaneously the accessibility story and the spec's
"typographically driven" register. Strength is never encoded by color alone —
line style and a text badge always accompany it.

## 6. Data contract summary

| Artifact | Producer | Consumer | Versioning |
| --- | --- | --- | --- |
| `concepts/*.md`, `graph/*.yaml` | humans (+ reviewed automation) | build | git |
| `graph.json` | build | app, external tools (notebooks, exports) | `schema_version`, semver |
| `search-index.json` | build | app shell | tied to graph.json version |

`graph.json` is a **public, documented artifact** (spec §6): external consumers are
expected. Breaking its shape is a major-version bump and a documented migration
note; additive fields are minor. GraphML/CSV export (spec §8.7) is implemented as
additional emitters in stage 4.5 (`atlas.graphml`, `nodes.csv`, `edges.csv`), not
as app features.

## 7. CI/CD

- **`ci.yml`** (every push and PR): install → `atlas-build --check` (full
  validation) → build+app unit tests → full `atlas-build` to prove artifacts emit.
  A PR that adds a malformed edge fails with the validator's message inline. This
  is the "validator = review gate" contribution flow from spec §8.1.
- **`deploy.yml`** (push to `main`): full build → deploy `dist/` to GitHub Pages.
  The deployed site footer shows `generated_from` (short SHA), giving every page
  provenance to the exact content commit.

## 8. Testing strategy

- **Build**: unit tests per stage with fixture content trees — especially validator
  rules (each rule has a failing fixture) and metric correctness on small
  hand-checkable graphs (a path, a star, two cliques joined by a bridge).
  Determinism test: build twice, assert byte equality.
- **App**: unit tests for `data/` accessors and path-finding against a fixture
  `graph.json`; a thin Playwright smoke suite for the success criteria in spec §11
  (the ≤ 3 clicks journeys), run against the built `dist/`.
- **Content**: needs no separate tests — the validator *is* the content test suite,
  which is precisely why it lives in the build layer and runs in CI.

## 9. How the expansion points land (spec §8 → mechanisms)

| Expansion | Mechanism already in place |
| --- | --- |
| In-app "propose an edge" | landed (M10): the `#/propose` composer — pickers over the schema vocabularies embedded in `graph.json` — deep-links the edge-proposal issue form prefilled with the claim as a sentence and as a copy-pasteable `edges.yaml` block; still no server, validator still the gate |
| Evidence/citations | landed (M8): `graph/references.bib` + validated `evidence` keys, resolved into `graph.json`; claims render a citation affordance and concept pages a Sources list |
| Learning paths | landed (M9): `paths/<id>.yaml` (§3.7) compiled and validated like every content type, walks emitted into `graph.json`; the walk view steps through them reusing the path graph preset |
| LLM-assisted authoring | operates on `graph.json` + `schema.yaml`; output enters as ordinary PRs through the same validator (spec §8.4's hard rule) |
| Forks / multiple atlases | `atlas-build --content DIR`; nothing hardcodes this repository's content |
| 10× scale | per-node JSON split (§4.5 escape hatch), paginated lists, and the standing "no full-graph render" rule |
| Applications as first-class content | `application` node type + APPLIED-IN edges already in `schema.yaml`; one new warn-level validator rule (§4.2); an index view reusing `views/common/` fragments |

## 10. Decision log

| # | Decision | Rationale |
| --- | --- | --- |
| 1 | Node + TypeScript as the single runtime | one toolchain for build and app; shared types across the data contract |
| 2 | No SPA framework | reader over immutable data; longevity and JS-budget trump ergonomics at this scale |
| 3 | Slugs as permanent primary keys | link rot is the graph's worst failure mode; friction on renames is a feature |
| 4 | Edges in one reviewable file, never in node front-matter | a claim belongs to both endpoints; the edge set must be reviewable as a set |
| 5 | Wiki-links ≠ edges; linked-but-unedged pairs surface as candidates | keeps the typed graph deliberate while letting prose feed curation |
| 6 | Math rendered at build time | instant pages, no client TeX parser, smaller JS budget |
| 7 | Metrics computed at build time, on trusted-strength subgraph only | client stays simple; speculative edges cannot distort centrality |
| 8 | Hash routing, full view state in URL | zero-config GitHub Pages + shareable/citable researcher views |
| 9 | Deterministic, versioned artifacts with git-SHA provenance | meaningful CI diffs; external consumers can trust and cite the dataset |

Anything not covered here is an implementation detail; anything that would violate
a boxed rule in §1, a validator rule in §4.2, or a decision above is an
architecture change and belongs in this file first.
