# UI Redesign: Views and Actions for the Post-v1 Atlas

v1 shipped everything SPECIFICATION.md asked of it (M0–M10): the reader app, the
symptom front door, graph lenses, researcher tools, citations, walks, and the
propose-an-edge flow. This document specifies the next generation of the UI. It
is a design document in the spirit of SPECIFICATION.md §3–§5 — it fixes *which
views exist, what question each answers, and what actions a user can take* — and
leaves implementation mechanics to ARCHITECTURE.md amendments and sequencing to
ROADMAP.md when the work is cut into milestones.

Two pressures prompt the redesign:

1. **The applications wave.** The next content push is a substantial batch of
   engineering applications (imaging pipelines, forecasting, design
   optimization, physical plant…), which will roughly double the node count and
   shift its mix toward `application` nodes. That changes who the app serves
   (§2) and what scale it must survive (§8).
2. **The data outgrew the views.** v1's graph rendering answers exactly one
   question shape — *what is near this node?* — and answers it well. The
   dataset's other dimensions (field membership, edge-type structure, strength
   distribution, and above all **absence** — the holes the project exists to
   find) have no visual home. The dimensions are real: nine node types,
   eighteen fields (set-valued per node), twenty-one edge types in eight
   groups, six ordered strengths, five communities, four per-node metrics. No
   single picture carries all of that, and the redesign stops pretending one
   could (§3).

## 1. Constraints that survive the redesign

Everything below operates inside the standing rules; none of them are loosened:

- **Static site on GitHub Pages.** No server, no accounts, hash routing, data
  from `graph.json` + `search-index.json` only. Nothing in this document can
  break the Pages deployment: the app is rebuilt and redeployed atomically by
  `deploy.yml`, and CI gates every merge behind the same checks as today.
- **The JS budget** (≤ 200 KB gzipped, currently 28.4 KB) and the **no new
  heavyweight dependencies** posture. Every view specified here is hand-written
  SVG or plain HTML; the only rendering library remains `d3-force`.
- **Accessibility as a gate, not a goal.** New views join the axe WCAG 2.1 A/AA
  matrix in both themes; every graph-visible relationship stays recoverable as
  text; strength is never encoded by color alone.
- **Full view state in the URL.** Every new view is shareable and citable by
  link, filters included.
- **Epistemic honesty on every surface** (spec §4): strengths visible,
  speculative content styled apart, and — extended by this document — *implied*
  claims are also forbidden: no view may suggest a relationship the edge list
  does not make (this is what rules out similarity embeddings, §7).
- **"Graph views are lenses, not the homepage"** (spec §3.3) and **no
  full-graph force layout** stay in force. §4.7 renders the whole trusted graph
  as a *fixed, build-time* constellation for orientation only, and says exactly
  how that respects the rule's rationale.
- **Determinism.** Anything computed (layouts, orderings, queue rankings) is
  computed at build time into `graph.json` (decision log #7), byte-identical
  across builds. The client keeps doing display joins and the one sanctioned
  filter-dependent BFS.

## 2. Users and how they explore

Spec §2's three personas remain the backbone. The redesign promotes two more
that v1 kept implicit, because the applications wave makes them load-bearing:

### 2.1 The Practitioner (new front-door persona)

*"I work on antenna design / weather models / motor drives. What mathematics is
my field quietly reusing, and what do neighboring fields know that I don't?"*

The Explorer enters from a concept they know; the Problem-Solver enters from a
symptom they feel. The Practitioner enters from **their own domain** — the
application is the search term. Spec §8.8 anticipated this ("applications run
the demonstration the other way"); a large application batch makes it a primary
journey rather than a demonstration:

- Wants, on one page: which structures their problem lights up, *in what role*
  (the APPLIED-IN edge contexts), under which assumptions, and where each
  structure is more mature than in their home field.
- The reverse query matters equally: from a structure they already use, *which
  other applications use it* — that is how machinery migrates.
- Interaction style: arrives by search ("weather prediction", "SAR"), reads one
  application page deeply, then hops into two or three structures. Success is
  leaving with a named technique from another field and the assumptions that
  license it.
- Example journeys the redesign is checked against (illustrative, not a content
  commitment): *weather prediction* → data assimilation is `kalman-filter`
  under linear-Gaussian assumptions → `chaos` explains why the ensemble exists
  → `fourier-analysis` carries the spectral solver. *Antenna design* →
  `greens-function` (radiation integrals) → `eigenvalues` (resonant modes) →
  `optimization` (pattern synthesis).

The application **anatomy page** (§4.2) and the **applications door on the
landing page** (§4.1) serve this persona; the **matrix** (§4.3) and **map**
(§4.4) let them survey what their field does and doesn't have.

### 2.2 The Curator (promoted from a footnote to a user)

The spec named the curator once and gave them git. Post-v1 the curator's real
scarcity is *selection*: deciding what to add next without the choice being
arbitrary. The redesign gives curation a first-class surface — the **work
queue** (§4.6) — whose items are mechanical signals computed from the data
itself (candidate edges, recurring unlinked assumptions, community bridge
deficits, dialect gaps, thin symptoms), each carrying the evidence for *why*
it's suggested. The queue is the anti-arbitrariness instrument: additions are
demand-driven from the graph's measured deficiencies, and drafting assistance
of any kind (spec §8.4) never gets selection authority.

### 2.3 Exploration modes

Personas cut across a small set of exploration modes, and each mode has a
representation that fits it (§3). Every view in §4 exists to serve one mode
well rather than several poorly:

| Mode       | The user's question                                | Primary personas         | Best representation                          |
| ---------- | -------------------------------------------------- | ------------------------ | -------------------------------------------- |
| **Hop**    | "What is adjacent to this idea?"                   | Explorer, Practitioner   | concept page + ego network + typed sentences |
| **Ossify** | "Give me the exact name/claim to cite."            | all                      | edge sentence, dialect table, citation       |
| **Triage** | "What is my problem an instance of?"               | Problem-Solver           | symptom cards, faceted filters               |
| **Survey** | "What does the whole space look like? What's *missing*?" | Researcher, Curator, Practitioner | matrix, map, metrics rankings, atlas overview |
| **Audit**  | "What licenses this tool? What breaks it? Says who?" | Practitioner, Researcher | assumption surface/trail, sources, strengths |
| **Tour**   | "Teach me a storyline."                            | Explorer                 | walks                                        |

## 3. The representation rule

The redesign's single design principle:

> **Choose the representation by the shape of the question, never by the shape
> of the data.** The data is one typed multigraph; the questions are many, and
> each gets the projection that answers it.

Consequences, stated once here and applied throughout §4:

- **Force layout answers "what is near X?" and nothing else.** It keeps the
  ego/lens/path presets and gains nothing new. It is constitutionally unable to
  show absence (a missing edge looks identical to empty space), unable to show
  set-valued dimensions (fields), and unable to support comparison (layouts
  shift as content changes).
- **Matrices answer "what exists — and what doesn't?"** An adjacency matrix
  shows every pair, so an empty cell is *information*: the structural holes the
  project hunts are literally visible as empty blocks. Incidence matrices do
  the same for node × field membership. Both are HTML tables — accessible,
  deterministic, dependency-free, and at home in the spec's "typographically
  driven" register.
- **Ranked tables answer "which most?"** — the metrics view already does this
  and is the template.
- **The sentence stays the atom.** Every cell, dot, and line resolves on
  interaction to the same edge-sentence fragment used everywhere since M3; a
  new view adds a projection, never a second phrasing of a claim.

## 4. View catalogue

Format per view: what it serves, the question, contents, actions, and (where
relevant) data needs and scale behavior. Routes follow the existing grammar;
all state is in the URL.

### 4.1 Landing v4 — three doors and a survey strip

Serves: everyone's first thirty seconds. The v3 ordering is kept deliberately —
symptoms first (spec §3.4's argument still holds), search in the hero,
applications second, browse third — with two changes driven by the applications
wave:

- **The applications door grows up.** Above ~8 applications the flat list stops
  scaling. Group application entries by their primary field (the first
  `fields` entry), one labeled row per field with its applications as cards;
  keep each card's "structures that meet here" line — it is the thesis in one
  line. A field chip row filters the section in place (URL: `#/?af=<field>`).
- **A survey strip.** One compact row linking the survey-mode views — matrix,
  map, metrics, questions/queue, atlas — each with a one-phrase description.
  These views are discoverable today only from the nav; the strip advertises
  the analytical half of the app without displacing the reading half.

### 4.2 Concept page enhancements

The node page stays the atom (spec §3.1). Four additions:

- **Application anatomy.** On `application` nodes, the connections block leads
  with a purpose-built section: incoming APPLIED-IN / MIGRATED-TO claims
  grouped by the *structure's* node type (moves together, models together…),
  each claim led by its edge `context` ("data assimilation", "resonant mode
  selection") rather than trailing it. The Practitioner reads roles first,
  names second.
- **Assumption surface.** Also on `application` nodes: a derived, clearly
  labeled section — "What this application leans on" — the union of the
  one-hop ASSUMES edges of every connected structure, each item linking to the
  assumption and to the structure that imports it, with FAILS-WHEN /
  REPLACED-BY surfaced beside it exactly as on structure pages. This is a pure
  display join over loaded data (no new computation class), and it is the
  spec's assumption-tracking priority (§5.3) paid forward to the engineer: the
  licensing conditions of a whole pipeline on one screen.
- **Assumption trail.** On any node with ASSUMES edges, a disclosure that
  unfolds the chain transitively (assumption's assumptions), rendered as an
  indented claim tree. The ASSUMES subgraph is a few dozen edges; the traversal
  is the same class as the sanctioned client-side path BFS. Cycles terminate on
  first revisit.
- **Situating links.** A small "see this node in: matrix · map · atlas" row in
  the metadata block, deep-linking each survey view with this node focused
  (`focus=<slug>`), plus a per-viewer "recently visited" strip (localStorage,
  last ~7, clearable — a convenience, never state the app depends on).

### 4.3 The matrix — `#/matrix`

Serves: **Survey**. The question: *which pairs are connected, how strongly —
and which are not?* The canonical answer to "multi-dimensional typed graph,
hairball risk" at this scale, and the one view where the project's negative
space is visible.

- **Form.** A real `<table>`: rows and columns are the same node list, ordered
  by `order=community|type|az|degree` (default `community`, subsorted by
  degree). Sticky headers both axes; the table scrolls inside its own
  container. Group separators and labeled chips mark community/type blocks,
  reusing the M5 community palette rules.
- **Cells.** A cell at (row A, col B) renders the strongest edge from A to B
  using the existing line grammar (solid/dashed/dotted + emphasis — drawn as a
  short stroke glyph, never color-alone), with a `×n` chip when parallel edges
  exist. Symmetric edge types render in both mirrored cells with the symmetric
  glyph; the table caption states the reading direction ("row → column").
  Gap edges render in the established warn style, visibly apart.
- **Interactions.** Hover/focus writes the cell's sentence(s) into the same
  live caption the graph views use; arrow keys move cell focus; Enter (or
  click) opens a **pair panel** listing every claim between the two nodes via
  the shared edge-claim fragment, with links to both concepts, the path view,
  and — when the pair is unconnected — the propose composer prefilled with
  both endpoints. Row/column headers navigate to the concept; a `focus=<slug>`
  param highlights one node's row and column as a crosshair.
- **Filters.** The lens filter grammar, same params (`type=`, `field=`,
  `edge=`, `strength=`); the default strength floor matches lens/path
  (speculative excluded; including it is the same explicit opt-in).
- **Reading absence.** An empty block where two communities meet is the
  missing-translation surface; the view says so in its empty-state and block
  hover text, and links "empty between A and B?" to the queue's bridge-deficit
  items (§4.6). This is the redesign's central move: the expansion pipeline
  and the visualization are the same artifact seen twice.
- **Scale.** Legible to roughly 120–150 nodes with compact cells and sticky
  headers (scrolling is fine; the crosshair keeps position readable). Beyond
  that, the view requires at least one filter before rendering — the same
  posture as the lens's 32-node fallback, with guidance in the empty state.

### 4.4 The migration map — `#/map`

Serves: **Survey** and **Audit** for the set-valued dimension no graph view can
carry: node × field membership. The question: *where does each structure live,
under what local name — and where has it never migrated?*

- **Form.** An incidence table: rows = structure nodes (applications excluded
  by default; they have `fields` but the question is about structures), columns
  = the eighteen schema fields in schema order. Row order
  `order=span|type|az`, default span-descending — the widest travelers on top.
- **Cells.** Three visibly distinct states, each with a text-equivalent title:
  - **named** — the node lists the field *and* carries an alias for it: the
    structure has a local name there (dialect row exists);
  - **present, unnamed** — the field is listed in `fields` but no alias for it
    exists: the structure is used there but the map lacks its local name. This
    is the existing missing-dialect warn made spatial;
  - **empty** — no claimed presence.
- **Interactions.** Row header → concept (anchored at its dialect table);
  column header → lens filtered to that field; a **named** cell shows the
  alias inline on focus/hover; a **present-unnamed** cell links the curator to
  the alias-wanted queue item. `field=<id>` highlights one column (the
  Practitioner's "what does my field have?" sweep); `focus=<slug>` one row.
- **Honesty note.** The map draws memberships, not claims: it never implies an
  edge. Empty cells in a wide row are *questions* (candidate dialect gaps or
  genuine absences), and the view's legend says exactly that.

### 4.5 Compare — `#/compare/<a>/<b>`

Serves: **Ossify** and **Hop** for pairs — the translation use-case made
concrete. The question: *how do these two concepts relate, in every register
the atlas knows?*

- **Contents**, in order: the two headers side by side (badges, summaries);
  the **merged dialect table** — one row per field in the union of both
  nodes' aliases, the two concepts as columns, so "what statisticians call X
  vs. what engineers call Y" reads on one line (this table alone justifies the
  view); direct edges between the pair as the usual claim list; shared
  neighbors grouped by node type, each with both connecting sentences; shared
  assumptions; and a link to the path view for the multi-hop chains.
- **Entry.** A "compare…" action on every concept page (pins the current node,
  then a search picker chooses the second; the pin lives only in the composer
  URL) and swap/replace controls on the view itself, mirroring the path view's
  ergonomics.
- **Empty case.** Two unrelated concepts are a legitimate comparison — the
  view says "no direct claims; no shared neighbors above <floor>" and offers
  the path finder and the propose composer, keeping the no-implied-claims rule.

### 4.6 The work queue — `#/queue` (and `graph/non-edges.yaml`)

Serves: **Curator** (primary), **Researcher** (transparency). The question:
*what should this atlas grow next, and on what evidence?* `#/questions` keeps
its identity — the §35 research-gap workflow and its statuses are epistemology,
not chores — and the queue becomes its sibling for mechanical curation signals
(nav: "Open questions · Work queue"; whether they share a route with tabs is an
implementation choice).

Queue sections, each item carrying its machine-checkable *why*:

| Signal                    | Source (build stage 4, all deterministic)                                          | Suggested action rendered                      |
| ------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------- |
| Candidate edges           | wiki-linked, unedged pairs (exists today)                                           | propose composer, both endpoints prefilled     |
| Link suggestions          | unconnected pairs with ≥ 2 shared trusted neighbors, witnesses listed               | propose composer; "record a non-edge"          |
| Bridge deficits           | community pairs joined by ≤ 1 trusted edge                                          | matrix deep-link to the empty block            |
| Recurring assumptions     | identical free-text `assumptions` strings on ≥ 2 nodes (normalized)                 | node-proposal issue form, prefilled            |
| Dialect gaps              | field in `fields` with no alias, on nodes with ≥ 2 dialects (the §4.4 unnamed cells) | alias-wanted issue link                        |
| Thin symptoms             | symptoms with < 2 moves or no worked example                                        | symptom edit pointer                           |
| Underconnected applications | the existing M7 warn                                                              | propose composer, application prefilled        |
| Unused references         | the existing info rule                                                              | cite-or-remove pointer                         |

Two supporting mechanics:

- **`graph/non-edges.yaml` — the reject ledger.** A reviewed decision *not* to
  connect a pair is data: `{between: [a, b], reason, see?}`. The validator
  checks endpoints exist and errors if a real edge contradicts an entry; the
  build suppresses matching candidate/link-suggestion items so the queue is
  idempotent; and the questions/queue view renders non-edges as "deliberate
  non-connections" — for this project, *"we checked, and these are false
  friends"* is content, not bookkeeping (the entropy cluster is the standing
  example).
- **Queue math stays explainable.** Link suggestion ranking is plain shared-
  neighbor counting with the witnesses shown — no opaque scores. A queue item
  a reader can't verify by eye doesn't ship.

### 4.7 The atlas overview — `#/atlas` (and the minimap)

Serves: **Survey** (orientation flavor). The question: *what does the whole
thing look like, and where am I in it?* This is the one place the redesign
touches the full-graph rule, so the reconciliation is explicit:

- The spec forbids a full-graph **force layout** as a **primary navigation
  surface** (§3.3, §9) because client-side force at scale is an illegible
  hairball that moves under you. The overview is neither: the layout is
  computed **once, at build time**, over the trusted subgraph (stage 4;
  emitted as `metrics.layout`, rounded coordinates keyed by slug), so it is
  deterministic, identical for every visitor, stable across sessions, and
  citable like every other artifact. It is linked from the survey strip and
  nav, never the homepage.
- **Form.** A fixed constellation: dots colored by node type, sized subtly by
  trusted degree, labeled on hover/focus with name + summary line; edges drawn
  only at the strength floor and above, with the standard line grammar; a
  communities toggle reusing the lens's `communities=1` param and palette.
  Click navigates. No zoom, no pan, no physics — legibility comes from the
  build-time layout being tuned once, not from camera controls.
- **The minimap.** Concept pages gain an optional small rendering of the same
  coordinates with the current node ringed and its neighbors emphasized — the
  "you are here" that hop-mode reading lacks today. Same data, zero extra
  computation.
- **Degradation plan, stated now.** The constellation is legible to roughly a
  hundred-odd trusted nodes. Beyond that the overview switches to community
  aggregation: one blob per community sized by membership, inter-community
  edges weighted by bridge count, expanding a community on interaction to its
  members in place. The rule's rationale (never ship a hairball) is honored by
  construction, not by hoping the dataset stays small.

### 4.8 Faceted index — `#/index?type=&field=&status=`

Serves: **Triage** and **Browse**. The A–Z index gains three chip-row facets —
node type, field, status — with counts, combining as AND, state in the URL.
Cheap (the data is already client-side), and it quietly covers requests the
nav can't: "all moves used in biology", "everything still marked hypothesis",
"applications in signal processing". The type-grouped landing section links
into pre-filtered index states instead of growing its own filters.

### 4.9 Graph renderer refinements

The force component keeps its three presets and gains only:

- **Arrowheads on directed edges.** Direction currently lives only in the
  sentence; a small marker at the target end adds a real dimension for a few
  lines of SVG. Symmetric types stay markerless — the absence is itself
  informative. Parallel-edge bows keep markers legible by construction.
- **Optional fixed coordinates.** Ego and lens accept precomputed positions
  (from `metrics.layout`) so a node sits where the atlas overview put it,
  making successive ego views spatially coherent. Off by default in ego (local
  legibility wins); on in lens when the filtered set is a large fraction of
  the graph.

## 5. Actions inventory

Cross-view actions a user can take, existing and new, so nothing here lives
only inside one view's spec:

| Action                          | Where                                          | Status |
| ------------------------------- | ---------------------------------------------- | ------ |
| Search (`/`), reverse-dialect lookup | everywhere / `#/dialects`                 | v1     |
| Hop typed edges, arrow-key claim lists, `?` panel | concept pages             | v1     |
| Share any view by URL           | all views (state already in URL)               | v1; add a visible "copy link" affordance with the `generated_from` SHA for citation |
| Download the dataset (JSON/GraphML/CSV) | metrics, questions                     | v1     |
| **Download what you see**       | matrix, map, lens: current filtered selection as CSV, generated client-side from loaded data | new |
| **Export sources as BibTeX**    | concept pages with a Sources list              | new    |
| Propose an edge (prefilled composer → issue) | concept pages, questions, **matrix pair panel, compare, queue** | v1, entry points widened |
| **Propose a node / an alias** (prefilled issue links) | queue items            | new    |
| **Compare two concepts**        | concept pages → `#/compare`                    | new    |
| **Trace assumptions**           | concept pages (trail disclosure); application anatomy | new |
| **Situate** ("see in matrix / map / atlas") | concept pages                      | new    |
| Step through walks; resume last position (localStorage) | walks              | v1; resume is new |
| Toggle communities              | lens, **atlas**                                | v1, extended |
| Keyboard: matrix cell navigation, compare swap | new views                       | new; documented in the `?` panel |

Everything stays server-free: proposals remain prefilled GitHub issues,
downloads are client-generated blobs, and per-viewer conveniences (trail, walk
resume) are localStorage with graceful absence.

## 6. Data-contract impact

All additive — one minor bump of `graph.json` (documented in
`docs/graph-json.md` as always), no breaking change for external consumers:

- `metrics.layout` — `{ <slug>: [x, y] }`, build-time trusted-subgraph layout,
  rounded for determinism (§4.7).
- `metrics.queue` — the §4.6 signal blocks (`link_suggestions` with witnesses,
  `bridge_deficits`, `recurring_assumptions`, `dialect_gaps`, `thin_symptoms`;
  candidate edges and gap summaries already exist).
- `non_edges` — the reviewed ledger, emitted for the transparency rendering.
- No new node fields; the assumption surface and compare view are display
  joins over data already shipped.

Build-layer touch points: stage 4 grows the layout and queue computations
(each unit-tested on fixture graphs per §4.2 practice); stage 1–2 gain the
`non-edges.yaml` reader and its three validator rules (endpoints exist,
contradiction with a real edge = error, suppression wiring). The layout run in
the build must be deterministic the way the app's synchronous d3-force use
already is — same library, fixed input order, fixed tick count.

## 7. Explicitly not doing, and why

- **Similarity embeddings (UMAP/t-SNE-style "concept maps").** Spatial
  proximity reads as a claim with no type and no strength — an implied edge
  the edge list never made — and the layout reshuffles every time content
  grows. Both violate the project's core discipline. The build-time layout of
  §4.7 draws only *actual* edges and is stable by construction.
- **WebGL / graph-library adoption (sigma, cytoscape, cosmograph).** Wrong at
  this scale (≤ a few hundred nodes), wrong for the dependency-longevity
  posture, and the matrix answers the "big picture" need those libraries are
  usually reached for.
- **Zoom/pan/camera controls and 3D.** The v1 decision stands: legibility by
  curation of what's rendered. The matrix scrolls; the atlas aggregates.
- **In-app free-text matching or any LLM feature.** The app stays a static
  reader; assisted authoring stays outside the app and enters as validated PRs
  (spec §8.4). The queue exists precisely so growth needs no oracle.
- **A "new UI" for its own sake.** Every v1 view keeps its route, URL grammar,
  and tests; this document adds projections and actions around a reading core
  that already works.

## 8. Scale thresholds under the applications wave

What flips as the node count grows, so nobody rediscovers it mid-batch:

| Around…    | What changes                                                                                                                            |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| ~60 nodes  | Landing applications section needs the §4.1 field grouping; hub structures' incoming APPLIED-IN lists need grouping by application field with an "and N more" cap (the ego cap pattern, applied to claim lists). |
| ~100 nodes | Lens fallback threshold and matrix compactness get revisited together; atlas overview approaches its aggregation switch (§4.7); search result grouping by node type becomes worth it. |
| ~150+ nodes | Matrix requires a filter (§4.3); atlas switches to community aggregation; the §4.5 per-node JSON split escape hatch (ARCHITECTURE.md) gets measured against real `graph.json` size — it remains an escape hatch, not a plan. |

One content-side note belongs here because it shapes the UI's load: the
admission bar for the wave is unchanged (an application earns a node only when
≥ 2 structures materially converge — the validator rule from M7), and
tool-shaped candidates enter as structures or aliases, not applications. The
UI consequence: application count grows slower than raw candidate lists
suggest, and the thresholds above are years of curation away at the honest
rate.

## 9. Suggested phasing

Sequencing belongs to ROADMAP.md when milestones are cut; the dependency-shaped
order is:

1. **Queue first** (§4.6 + `non-edges.yaml`): it is the selection instrument
   for the applications wave the owner wants to start now, and it is
   build-layer work with a thin view — highest leverage per line.
2. **Matrix + map** (§4.3, §4.4): the survey layer; the matrix additionally
   renders the queue's bridge deficits, so it lands best right after.
3. **Practitioner polish** (§4.1 landing v4, §4.2 anatomy + assumption
   surface): timed with the first application batch landing, so the new
   content debuts into a UI shaped for it.
4. **Pairs and orientation** (§4.5 compare, §4.7 atlas + minimap, §4.8 facets,
   §4.9 arrowheads — the last two are cheap and can ride along anywhere).

## 10. Open questions

- Does the queue live inside `#/questions` as tabs or as its own route? (This
  document leans sibling-route; the nav label matters more than the URL.)
- Matrix default ordering: community blocks read best for the Researcher, but
  type blocks may read better once applications dominate — decide on real
  data when the first batch lands.
- Should the assumption trail's transitive closure move to build time if it
  grows past display-join scale? (Decision log #7's boundary; today it is a
  dozen edges and client-side is simpler.)
- Compare as a route (`#/compare/a/b`) vs. an overlay on concept pages — the
  route wins on shareability, which is why it's specified that way, but the
  entry ergonomics deserve a prototype.
- Whether the map should optionally include applications as rows once the wave
  lands (the "which fields does this application draw on" sweep) — likely yes,
  behind a toggle, but it changes the view's question subtly enough to defer.
