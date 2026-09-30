# Bridge Atlas Creation Process

## Purpose

This document defines a safe, reviewable process for creating the **Bridge
Atlas**: a deterministic survey view in which graph communities appear as
territories and trusted cross-community claims appear as bridges.

The view answers two questions:

1. **Where does mathematical machinery cross community boundaries?**
2. **Which community pairs have no trusted crossing recorded yet?**

The Bridge Atlas is an orientation and curation instrument. It does not replace
the concept page, the adjacency matrix, the path finder, or the focused Atlas
neighborhood. Its aggregates must always open into the exact claims they
summarize.

The governing principle is:

> Geography may summarize the trusted graph, but it must never manufacture a
> relationship.

This process extends the community-islands direction in
[`docs/atlas-visualization-roadmap.md`](atlas-visualization-roadmap.md). It
assumes the graph-first Atlas workspace and focus model are already stable.

## What the visual grammar means

The visual metaphor has a deliberately small vocabulary.

| Mark | Meaning | Must not imply |
| --- | --- | --- |
| Territory | One build-computed graph community | A mathematical field, taxonomy, or objective truth |
| Territory area | Member count, using one documented scale | Importance or evidential quality |
| Landmark | A high-degree concept inside that community | The only important concept in the community |
| Bridge | One or more trusted edges crossing between two communities | A new aggregate mathematical claim |
| Bridge width | Cross-community trusted-edge count, using a compressed scale | Strength, proof quality, or causal importance |
| Bridge label | The exact number of underlying trusted edges | A score or ranking |
| Frontier crossing | No trusted edge is recorded for that community pair | Proof that the communities are unrelated or that an edge ought to exist |

An aggregate bridge has no single epistemic strength. It may contain theorem,
special-case, analogy, and speculative claims at once. Therefore the overview
bridge uses a neutral aggregate style. Strength appears only in the selected
bridge's distribution and in its individual claim list, where the existing
solid/dashed/dotted grammar remains exact.

Community names are descriptions, not ontology. The first version should label
territories using deterministic landmark bundles such as “Eigenvalues · Markov
chains · Diffusion.” Short editorial names may be added later, but they must sit
beside the landmark bundle and must never alter membership.

## Non-goals

The first Bridge Atlas does not:

- create a geographic map or imitate real coastlines;
- use a force simulation in the browser;
- infer similarity from embeddings, shared words, or visual proximity;
- rank communities by importance;
- turn every absent community pair into a candidate edge;
- replace the readable edge-claim sentence with a tooltip-only summary;
- expose all concept nodes and all edges in the default overview;
- introduce zoom, filtering, community aggregation, and frontier workflow in
  one pull request.

## Creation workflow

### Step 0: Freeze the interpretation contract

Before writing renderer code, amend `UI_REDESIGN.md` and the Atlas roadmap with
the decisions that would otherwise be made accidentally in CSS:

- community membership comes only from the build artifact;
- territory position and shape are deterministic build outputs;
- territory area represents member count and nothing else;
- bridge width represents the number of trusted cross-community edges;
- aggregate bridges are selectable and disclose every underlying claim;
- frontier mode says “no trusted edge recorded,” never “missing mathematics”;
- filters apply to the claims before aggregation, so counts always match what
  the reader can inspect;
- the complete state needed to reproduce the view lives in the URL;
- camera position, if later supported, is presentation state rather than graph
  state.

Record one representative data snapshot for design work: community count,
member counts, all community-pair edge counts, and the zero-edge pairs. This is
test input, not a value to hard-code in the app.

### Step 1: Define an additive build contract

Add a `metrics.bridge_atlas` object to `graph.json`. Treat this as an additive
artifact schema change. A proposed shape is:

```ts
interface BridgeAtlasMetrics {
  communities: Array<{
    id: number;
    member_slugs: string[];
    member_count: number;
    landmark_slugs: string[];
    internal_trusted_edge_count: number;
    center: [number, number];
    territory_path: string;
  }>;
  bridges: Array<{
    source_community: number;
    target_community: number;
    trusted_edge_count: number;
    edge_indexes: number[];
    strength_counts: Record<string, number>;
    type_counts: Record<string, number>;
  }>;
  frontiers: Array<{
    source_community: number;
    target_community: number;
    trusted_edge_count: 0;
  }>;
}
```

The exact field names may follow existing build conventions, but the artifact
must provide stable IDs, exact underlying edge references, and enough geometry
that the client only performs display joins.

Do not serialize prose descriptions of bridges. The readable meaning continues
to come from the underlying edge records and the shared edge-claim renderer.

### Step 2: Derive communities and landmarks

Use `metrics.nodes[*].community` as the sole membership authority.

For each community:

1. collect trusted member nodes;
2. collect trusted internal edges;
3. order landmark candidates by trusted degree descending, then betweenness
   descending, then slug ascending;
4. retain two or three landmarks, with a cap that prevents one label from
   occupying the whole territory;
5. emit the complete sorted member list for testing and drill-down.

Tie-breaking must be explicit and slug-based so that repeated builds are byte
identical.

If the community detector can renumber otherwise unchanged communities, fix
that in the build before attaching UI state to numeric IDs. One deterministic
option is to sort communities by their smallest member slug and remap them to
consecutive IDs after detection.

### Step 3: Construct deterministic territories

Territories should preserve recognition of the existing fixed Atlas rather
than form a second unrelated geography.

Recommended first algorithm:

1. start from each member's existing `metrics.layout` coordinate;
2. compute the community centroid;
3. compute a convex hull around member coordinates with a fixed padding;
4. for one- and two-point communities, emit a deterministic circle or capsule;
5. smooth corners only as a pure SVG display operation with fixed parameters;
6. fit all territories into the common Atlas viewport using one uniform
   transform;
7. resolve overlap with a deterministic, bounded community-level separation
   pass, never a client-side force simulation;
8. emit the final center and SVG path at build time.

The hull does not claim that concepts near the coast are marginal. It is only a
container around fixed members. Do not encode centrality as distance from the
territory center.

Add golden tests for the territory paths and a byte-identical double-build
test. A one-node content addition should move as little existing geography as
the algorithm permits; capture that stability in a fixture test.

### Step 4: Aggregate trusted bridges

For every trusted edge whose endpoints have different non-null community IDs:

1. canonicalize the pair as `(minCommunity, maxCommunity)` for aggregation;
2. retain the original directed edge unchanged;
3. append its stable edge index to the aggregate pair;
4. increment the pair's edge-type and strength counts;
5. sort edge indexes by endpoint slugs, edge type, strength, and original index;
6. emit bridge pairs in community-ID order.

Bridge width should use a documented compressed mapping such as
`1 + 2 × log2(1 + count)`. Always print the exact count on selection. A bridge
with thirteen claims should look busier than one with two, but it should not
be six times wider.

The bridge path should connect territory boundaries, not territory centers.
Parallel bridges are unnecessary in overview. Direction appears in the claim
inspector after selection; an aggregate containing edges in both directions
must not be drawn as one directional arrow.

### Step 5: Derive frontiers without turning them into claims

Frontiers are the complement of recorded community-pair bridges over
communities that contain at least one trusted node.

For each unordered pair:

- if the trusted cross-edge count is zero, emit a frontier record;
- if filters reduce a previously populated pair to zero, describe it as
  “no visible trusted edge under these filters,” not as a global frontier;
- do not rank a frontier as promising unless the work queue has independent
  witnesses for that pair;
- do not prefill a proposed edge with invented endpoints merely because two
  communities lack a crossing.

Frontier mode should be opt-in. Its permanent caption must state that absence
means “not represented in this dataset.” Selecting a frontier may link to the
queue or matrix, but its primary action is “inspect the absence,” not “add an
edge.”

### Step 6: Build the overview renderer

Create the first client slice with no camera and no expanded member view.

The default overview contains:

- one territory per emitted community;
- the deterministic landmark bundle and member count;
- one bridge per populated community pair;
- bridge width and a selectable exact count;
- a compact legend;
- a selected-bridge inspector using shared claim components;
- a `Known bridges` / `Frontiers` mode switch;
- links from the inspector to the matrix and focused Atlas.

Do not permanently label every bridge. Show the exact count when the bridge is
focused or selected, and keep the highest-value labels only if collision tests
show that they fit. The initial render should be legible without hover.

The selected-bridge inspector should show:

1. the two community landmark bundles;
2. exact trusted-edge count;
3. edge-type and strength distributions;
4. every underlying claim, grouped by direction and rendered with the shared
   edge-claim component;
5. evidence links already present on those claims;
6. actions to open the same pair in the matrix and to focus either endpoint.

### Step 7: Define URL and interaction state

Use URL state for selections that change the mathematical reading:

```text
#/atlas?layout=bridges
#/atlas?layout=bridges&bridge=2-6
#/atlas?layout=bridges&mode=frontiers
#/atlas?layout=bridges&bridge=2-6&edge=GOVERNS&strength=theorem
```

Recommended state rules:

- `layout=bridges` activates the view;
- `bridge=<low>-<high>` selects a community pair;
- `mode=bridges|frontiers` defaults to `bridges`;
- existing `type=`, `field=`, `edge=`, and `strength=` filters are reused;
- invalid or obsolete community pairs are removed through one canonical URL
  rewrite;
- selecting a concept from an expanded territory changes to the existing
  `focus=<slug>` Atlas state rather than creating a second focus model.

Hover is preview only. Click, Enter, or Space establishes selection. Escape
returns focus to the selected bridge after closing the inspector.

### Step 8: Add territory expansion only after overview is stable

In the second client slice, selecting a territory expands its concepts using
their fixed relative coordinates. Other territories remain visible but quiet.

Expansion requirements:

- all member concepts are reachable by keyboard;
- internal edges remain hidden until a concept is focused, unless a dedicated
  local-structure mode is later justified;
- selecting a member enters the existing one-hop Atlas focus state;
- closing the focus state returns to the same territory and bridge selection;
- narrow screens place the territory's concepts in a readable list if the map
  cannot provide non-overlapping targets.

Do not combine this step with the first bridge-renderer pull request.

### Step 9: Preserve text equivalence and accessibility

Every map-visible fact needs a non-spatial equivalent.

- Territories are also an ordered list with member and internal-edge counts.
- Bridges are also a table of community pairs and exact trusted-edge counts.
- A selected bridge exposes all underlying claim sentences without hover.
- Frontier pairs are also a list using the exact “no trusted edge recorded”
  wording.
- Width, color, and position never carry meaning alone.
- Bridge targets meet pointer and touch target requirements even when the
  visible stroke is thin.
- Keyboard order follows the bridge table order, not arbitrary SVG path order.
- The inspector uses a heading and live-region update appropriate for a
  deliberate selection; hover does not announce changes.
- Light and dark themes retain territory separation, bridge contrast, focus
  rings, and readable selected states.

If an SVG path cannot provide robust native interaction, pair it with a real
HTML button or list control rather than adding custom keyboard behavior to a
generic SVG group.

### Step 10: Verify meaning before visual polish

Verification happens in four layers.

#### Build tests

- community membership exactly matches `metrics.nodes[*].community`;
- member, internal-edge, and bridge counts match a direct trusted-graph scan;
- every bridge has at least one underlying trusted edge;
- every underlying edge crosses the two named communities;
- frontier records are exactly the zero-count unordered pairs;
- community remapping, landmarks, paths, and ordering are deterministic;
- two builds emit byte-identical `bridge_atlas` data.

#### Unit tests

- URL parsing, canonicalization, and serialization;
- filters run before aggregation and update counts correctly;
- mixed-direction aggregate bridges do not acquire an arrow;
- bridge selection resolves to the exact edge records;
- obsolete community-pair URLs recover predictably;
- frontier wording distinguishes global absence from filter-induced absence.

#### End-to-end tests

- default overview draws exactly the emitted communities and bridges;
- selecting a bridge shows every underlying claim and no unrelated claim;
- reload restores layout, mode, filters, and selected pair;
- matrix and focused-Atlas handoffs carry the intended state;
- keyboard-only selection and inspector dismissal work;
- axe passes in light and dark themes;
- desktop, tablet, and narrow-mobile layouts remain usable.

#### Curatorial review

- inspect the five thickest bridges and confirm that aggregation tells a
  coherent but non-overclaiming story;
- inspect every frontier and confirm that the wording does not imply a claim;
- inspect landmark bundles for misleading community descriptions;
- compare the map with the matrix and verify that no visible crossing is
  absent from the underlying cells;
- read representative theorem, analogy, speculative, directed, and symmetric
  claims through the inspector.

## Delivery sequence

Ship the Bridge Atlas in small vertical slices.

### Pull request 1: Deterministic bridge data

- artifact schema and TypeScript model;
- community normalization and landmarks;
- deterministic territory geometry;
- bridge and frontier aggregation;
- build fixtures and byte-identity tests;
- documentation of visual semantics.

No new route is required in this pull request. Inspect the emitted artifact in
tests before committing to the renderer.

### Pull request 2: Read-only overview

- `layout=bridges` route/state;
- territories, landmark labels, and bridge widths;
- selected-bridge inspector with exact shared claim rendering;
- text-equivalent community list and bridge table;
- URL, unit, end-to-end, accessibility, and responsive tests.

This is the first user-visible release and must be complete without frontier
mode.

### Pull request 3: Frontier mode and curation handoff

- exact zero-pair derivation in the visible filtered state;
- guarded frontier language;
- matrix and queue handoffs;
- tests that absence never becomes a proposed claim automatically.

### Pull request 4: Territory expansion

- expanded member view;
- stable transition to existing concept focus;
- keyboard and narrow-screen list equivalent;
- regression coverage for returning to the prior Bridge Atlas state.

Camera controls, decorative coast refinement, and animation belong in later
changes only if observation shows they improve comprehension.

## Definition of done

The Bridge Atlas is ready when:

- a reader can identify the graph's main communities and busiest crossings in
  under a minute;
- selecting any visible bridge reveals the exact trusted claims it summarizes;
- bridge counts agree with a direct scan of `graph.json` under every filter;
- a frontier is impossible to mistake for evidence of a relationship;
- meaningful state survives reload and can be shared as a URL;
- all visible facts have readable, keyboard-accessible text equivalents;
- the layout is byte-deterministic and stable enough to remain recognizable
  after ordinary content additions;
- the matrix remains the audit surface, the focused Atlas remains the local
  exploration surface, and the Bridge Atlas remains the migration-oriented
  overview.

## Questions to settle during Step 0

These decisions should be made explicitly before Pull request 1:

1. Should community IDs be normalized after detection, and by which stable
   signature?
2. Is raw trusted-edge count the permanent width measure, or should the UI also
   offer a density-normalized comparison?
3. Are deterministic landmark bundles sufficient, or does the project want a
   reviewed editorial label for each community?
4. Should frontier mode show only zero-count pairs, or also one-edge “thin
   crossings” as a separate, clearly named category?
5. Does `layout=bridges` live inside `#/atlas`, as recommended, or deserve a
   separate route after usability testing?

Until those questions are settled, implementation may prototype geometry but
should not commit a public URL or artifact contract.
