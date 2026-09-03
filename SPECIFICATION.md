# Specification: The Structure Atlas

An interactive field guide to the mathematical structures that recur across science.

This document specifies the application that turns the research notebook in `README.md`
into a navigable, analyzable, and eventually collaborative tool. It is a design-guiding
specification, not an implementation plan: it fixes intent, priorities, and architecture
boundaries so that detailed design and implementation can proceed without re-litigating
purpose.

---

## 1. Purpose and product thesis

The README establishes a claim: a small set of mathematical structures, canonical models,
and reusable moves recur across physics, engineering, biology, computation, and
statistics, and recognizing the *abstract form* of a problem is a transferable skill.

The app exists to make that claim usable. Its product thesis:

> **Knowledge about cross-disciplinary structure is graph-shaped, and it should be
> stored, browsed, and analyzed as a typed graph — never as a linear document.**

The current single-file README demonstrates the failure mode this app fixes: duplicated
section numbers, concepts written up twice, schemas revised in place with no current
version. The app is the correct container for this material.

Three things the app is **not**:

- Not an encyclopedia. Wikipedia and textbooks explain concepts in depth; this app
  explains *relationships between* concepts and stops there, linking outward for depth.
- Not a taxonomy of disciplines. Fields appear as metadata and dialect labels, never as
  the primary hierarchy.
- Not a claims engine. Candidate research gaps are stored as *hypotheses with a
  verification workflow*, never presented as findings.

## 2. The three users and how they enter

The app has one dataset but three front doors, matching the three usage modes already
implicit in the README. Every design decision should be checked against these personas.

### 2.1 The Explorer (learn / browse)

*"I know eigenvalues from linear algebra class. What else are they?"*

- Enters via a **concept**: search box or an index of nodes.
- Wants: a concise structural definition, the dialect table ("statisticians call this
  principal components; control engineers call these poles"), the assumptions that
  license the tool, one or two memorable canonical examples, and typed links outward.
- Interaction style: hop-and-skim. Sessions are chains of 1-click hops along edges
  ("spectral gap → mixing time → Markov chains"). Every mentioned concept must be a link.
- Success looks like: "I didn't know normal modes and PCA were the same move."

### 2.2 The Problem-Solver (recognize / translate)

*"My model has too many parameters and I don't know what to reach for."*

- Enters via a **symptom**: the problem-recognition index (README §25) becomes the app's
  most prominent interaction, not a buried table.
- Wants: symptom → ranked candidate moves → the fields where each move is mature →
  worked canonical examples. Also the reverse-dialect lookup: "I read a biology paper
  saying 'perfect adaptation' — what is that in control language?"
- Interaction style: goal-directed, 2–4 clicks to an answer, then leaves. Speed and
  scent matter more than beauty here.
- Success looks like: "I recognized my problem as a hidden-state estimation problem and
  found the Kalman-filter family in ten seconds."

### 2.3 The Researcher (analyze / hypothesize)

*"Which mature techniques in field A have no analogue in field B — and is that real or
just vocabulary?"*

- Enters via the **edge set**: filters by edge type and strength; sorts nodes by derived
  metrics (betweenness, disciplinary span, dialect count, missing-edge score).
- Wants: the POSSIBLE-MISSING-MIGRATION list with each item's verification status per
  the §35 workflow (established transfer / renamed transfer / failed transfer with
  reason / open candidate); the ability to see *why* an edge is claimed (strength,
  context, evidence).
- Interaction style: query-and-inspect, longer sessions, wants to export or cite.
- Success looks like: a genuine, checkable research question generated from the map.

A fourth, quieter role — **the Curator** (currently the repository owner) — maintains the
dataset. The curator edits files in git; the app never needs a write path in v1
(see §8, Expansion).

## 3. Core interaction model

### 3.1 The node page is the atom

The fundamental unit of the app is the **concept page**. Everything else (graph view,
symptom index, metrics tables) exists to route people to node pages and between them.
A node page shows, in order:

1. **Canonical name + node type badge** (object / operation / model / principle /
   phenomenon / move / theorem / dialect) — the ontology of README §1 and §12 made
   visible. The badge color-codes the ontological class everywhere in the app.
2. **One-paragraph structural summary** — what question this structure answers, in the
   README's register ("which directions are preserved by an operator except for scale?").
3. **Dialect table** — field-specific names, one row per field. This is a first-class
   feature, not metadata trivia; terminology barriers are one of the two core problems
   the app attacks.
4. **Assumptions** — the conditions that license the tool (smoothness, linearity,
   stationarity…), each linking to its own node where one exists, with FAILS-WHEN /
   REPLACED-BY edges surfaced right beside them ("when a shock forms, classical
   derivatives fail → weak solutions").
5. **Typed connections, grouped by edge type** — not a flat "see also" list. "Special
   case of", "Approximated by", "Same skeleton as", "Migrated to" are semantically
   different and must read differently.
6. **Canonical examples** — one or two, memorable, concrete (Reynolds number,
   random walk → diffusion).
7. **Local neighborhood graph** — a small ego-network (1–2 hops) rendered beside the
   text. *Never* the full graph on a node page.

### 3.2 Edges are sentences

An edge is always presented as a readable claim with its qualifiers:

> **linear-Gaussian state-space model** —IS-A→ **state-space model**
> *(strength: theorem · context: exact)*

> **classical stability margins** —POSSIBLE-MISSING-MIGRATION?→ **biological regulation**
> *(strength: speculative · status: open candidate · needs literature check)*

Edge **strength** (identity / theorem / special case / strong analogy / heuristic
analogy / speculative) is rendered visually — solid, dashed, dotted lines in graph
views; badges in lists — because the README's central epistemic discipline is refusing
to let attractive analogies masquerade as identities. The entropy cluster ("same word,
three different relationships") is the canonical test: the app must be able to show that
Shannon entropy ↔ Gibbs entropy is a near-identity while thermodynamic entropy ↔
Kolmogorov–Sinai entropy is a family resemblance.

### 3.3 Graph views are lenses, not the homepage

A full-graph force layout is a hairball and is explicitly not the primary interface.
Graph rendering appears only as:

- the **ego-network** on each node page (1–2 hops, always legible);
- a **filtered subgraph view** the user composes: by edge type ("show only
  FIELD-DIALECT-OF"), node type ("only reusable moves"), field ("everything used in
  biology"), or strength ("theorem-grade edges only");
- **path view**: pick two concepts, see the connecting chains (this powers the §34
  translation chains as a computed feature rather than a hand-written list).

### 3.4 The symptom index is the front page

The landing page leads with the Problem-Solver's question — "What does your problem
look like?" — offering the symptom list (too many parameters; hidden state + noisy
measurements; coupled linear variables; oscillation in a feedback loop; …) alongside
plain search. This ordering is deliberate: search serves people who already know a
term; the symptom index serves the person the whole project is for — someone facing a
problem whose mathematical form they haven't recognized yet.

## 4. Look and feel

- **Register: field guide, not textbook and not dashboard.** Calm, dense-but-legible,
  typographically driven. Prose and tables carry the content; visualization supports it.
  Think well-set reference book with live cross-references, not a node-graph toy.
- **Math is content.** Inline and display math must render well (KaTeX-class quality).
  Formulas appear where the README uses them — sparingly, as anchors, not walls.
- **Color is semantic and nothing else.** One hue per ontological node class, one visual
  grammar (solid/dashed/dotted, or weight) for edge strength, used identically in
  badges, lists, and graph views. No decorative color.
- **Epistemic honesty is visible.** Speculative content (analogies, candidate gaps) is
  *styled* differently — flagged, never blended in with theorem-grade content. A reader
  should be able to tell at a glance whether they are looking at mathematics or
  hypothesis.
- **Fast and quiet.** Every navigation is instant (static data, client-side routing).
  No loading spinners for core content, no animation beyond gentle graph settling.
- **Light and dark themes**, both first-class; graph and math rendering must remain
  legible in both.
- **Keyboard-first affordances** for the Explorer: `/` to search, arrow-hop along edges.

## 5. What to emphasize (design priorities, ordered)

1. **Relationships over definitions.** The unique value is the typed edge, the dialect
   table, and the translation chain. If a screen spends more pixels defining a concept
   than connecting it, it is misallocated.
2. **The reusable move as a first-class citizen.** "Linearize it, nondimensionalize it,
   diagonalize it, condition on the observation, coarse-grain it" — the moves view is
   the pedagogical heart of the app and deserves its own index page.
3. **Assumption tracking.** ASSUMES / FAILS-WHEN / REPLACED-BY edges are what make this
   a *guide* rather than a map of slogans. Surfacing "what licenses this tool and what
   breaks it" everywhere is a differentiator.
4. **Honest strength labeling.** See §3.2 and §4; this is a hard requirement on every
   surface that displays an edge.
5. **The research-gap pipeline.** Candidate missing migrations, each with its §35
   verification status, presented as an explicit "open questions" area.
6. **Provenance.** Every node and edge links back to its source — initially README
   sections / concept files in the repo; eventually literature references from the
   edge schema's evidence field.

## 6. Where it runs

- **Primary target: a static site** — pure client-side HTML/JS/CSS over a compiled
  `graph.json`, deployed on GitHub Pages from this repository. No server, no database,
  no accounts. Rationale: the dataset is small (target: hundreds of nodes, low
  thousands of edges — trivially client-side), the curator already works in git, and
  zero infrastructure means the app can never rot behind an unpaid server.
- **Works fully offline once loaded**; the dataset ships with the page.
- **Responsive**: reference-reading and symptom lookup must work well on a phone; the
  composed subgraph views may be desktop-optimized.
- **Local development**: `git clone` + one build command + any static file server.
  No environment beyond Node (or Python — implementation's choice, but exactly one
  runtime).
- **The data layer is independently consumable**: `graph.json` is a documented, stable
  artifact that other tools (notebooks, scripts, future apps) may load directly.

## 7. Architecture and modules

Three layers with one-way dependencies: **content → build → app**. The app never reads
content files directly; the build never knows about the UI.

### 7.1 Content layer (source of truth, in git)

- `concepts/<slug>.md` — one file per node. YAML front-matter carries the node schema
  from README §33 (`canonical_name`, `node_type`, `aliases` with per-field dialect
  labels, `fields`, `assumptions`, `canonical_examples`, `status`); the Markdown body
  is the explanatory prose (math in standard `$…$` / `$$…$$`).
- `graph/edges.yaml` — the typed edge list, per the §16/§27 edge vocabulary and the §33
  edge schema (`type`, `strength`, `context`, `directionality`, `evidence`, `notes`).
  Edges live in one file (or one file per edge type if it grows), *not* inside node
  front-matter, so that relationship claims are reviewable as a set.
- `graph/schema.yaml` — the controlled vocabularies: node types, edge types, strength
  levels, symptom list, field list. The single current version of what §1/§10/§16/§27
  kept re-drafting; changing the ontology means editing exactly this file.
- `docs/` — method documents (working method, research-gap workflow, this
  specification). `README.md` shrinks to purpose + navigation.

### 7.2 Build layer (compiler + validator)

A single build tool with three responsibilities:

- **Validate**: every edge endpoint exists; every node type / edge type / field /
  strength is in `schema.yaml`; no orphan nodes without justification; required schema
  fields present. *The build fails loudly on violations* — this is the app's test
  suite, and it is what keeps the dataset from re-developing README-style drift.
- **Compile**: emit `graph.json` (nodes + edges + rendered-HTML bodies) as the app's
  only input.
- **Analyze**: compute the §33 derived metrics — degree and betweenness centrality,
  community detection, disciplinary span (including the Shannon-entropy span score),
  dialect count, missing-edge candidates — and emit them into `graph.json` so the app
  displays metrics without ever computing graph algorithms client-side.

CI runs the build on every push; Pages deploys on green.

### 7.3 App layer (static SPA)

Modules, mirroring §2 and §3:

| Module | Serves | Contents |
| --- | --- | --- |
| **Shell** | all | routing, search index, theme, layout, keyboard nav |
| **Concept** | Explorer | node page per §3.1, ego-network component |
| **Symptom** | Problem-Solver | landing interaction; symptom → moves → fields routing |
| **Dialect** | Problem-Solver | reverse lookup: any alias in any field → canonical node + full dialect table |
| **Lenses** | Explorer/Researcher | composed subgraph views, path/translation-chain finder |
| **Atlas metrics** | Researcher | hubs, bridges, span/dialect rankings from precomputed metrics |
| **Open questions** | Researcher | missing-migration candidates with verification status |
| **Graph renderer** | shared | one rendering component (ego, lens, path views all use it) |

Shared, enforced internally: a single **semantic style module** (node-type colors, edge-
strength line grammar, status badges) that every module imports — the visual grammar of
§4 has exactly one definition.

## 8. Room for expansion (design for these now, build them later)

Decisions above are shaped so the following require no architectural rework:

1. **Contribution workflow.** v1 write path is git PRs (validator = review gate). Later:
   a lightweight in-app "propose an edge/node" form that generates a PR. The content
   layer being plain files with a schema makes this purely additive.
2. **Evidence and literature.** The edge schema already reserves `evidence`; later,
   citations render as footnotes and the research-gap workflow tracks its literature
   checks in-data. Do not launch v1 blocked on references; do not drop the field.
3. **Learning paths.** Ordered walks through the graph ("the eigenvalue tour",
   "from random walk to renormalization") as a new content type (`paths/*.yaml`)
   compiled the same way. The path-view module is the seed of this.
4. **LLM-assisted features.** The typed graph is deliberately machine-readable:
   candidate uses include drafting new node files in house style, symptom-matching from
   a free-text problem description, and dialect-aware literature search for the gap
   workflow. These consume `graph.json` and the schema; nothing in v1 needs to change,
   and no LLM feature may *write* to the dataset without passing the same validator
   and human review as any PR.
5. **Multiple graphs / forks.** Keep the build parameterized on a content directory so
   a fork can maintain a domain-specific atlas (e.g. a biology-centric one) with the
   same tooling.
6. **Quantitative growth.** Nothing in the UI may assume the current ~30 nodes: lists
   paginate/filter, search scales, and the "never render the full graph" rule keeps
   rendering costs bounded as the dataset grows 10×.
7. **Export.** `graph.json` is already the export; add GraphML/CSV emitters in the
   build layer if network-analysis users ask.

## 9. Non-goals for v1

- No accounts, personalization, or server-side anything.
- No in-app editing.
- No attempt at comprehensive coverage — depth of connection on ~30–50 nodes beats
  breadth of 500 stubs.
- No full-graph visualization as a primary navigation surface.
- No mobile app; the responsive site is sufficient.

## 10. Guiding principles (tie-breakers for later decisions)

1. **The graph is the product; the app is a lens.** When app convenience and data
   integrity conflict, the data wins.
2. **Every claim carries its strength.** No surface may display a relationship without
   its epistemic weight being recoverable at a glance.
3. **Dialects are bridges, not noise.** When in doubt, spend the effort on translation
   between fields — it is the app's reason to exist.
4. **Assumptions travel with tools.** A technique shown without its licensing
   conditions is a bug.
5. **Prefer boring infrastructure.** Static files, git, one build step. The interesting
   complexity budget is spent entirely on the content model and the reading experience.
6. **The map uses its own medicine.** Where the app analyzes itself (span entropy,
   spectral/community structure of its own graph), surface that — it is both quality
   control and the best possible demo of the thesis.

## 11. Success criteria

- An Explorer starting from "eigenvalues" reaches "spectral gap governs mixing time in
  Markov chains" in ≤ 3 clicks, having seen the dialect table on the way.
- A Problem-Solver goes from the symptom "too many dimensional parameters" to
  Buckingham Π with a worked Reynolds-number example in ≤ 3 clicks.
- A Researcher can list all speculative-strength edges with their verification status
  in one view, and export the dataset in one action.
- The build rejects a malformed edge (unknown type, missing endpoint, missing strength)
  with a clear error.
- The entire README's current content is representable in the content layer with no
  information loss — including the distinctions it is most careful about (Kalman filter
  vs. HMM nomenclature; entropy false friends; renormalization ≠ dimensional analysis).
