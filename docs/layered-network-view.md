# Layered Network View: Structure to Use

> Implemented 2026-09-30 at `#/atlas?layout=flow`. The shipped slice keeps
> deterministic ordering in the client, uses `Structure to Use` as the visible
> product label, and leaves field families, aggregate bundles, and complete
> chain highlighting for separate reviewed work. Current UI evidence is stored
> under `artifacts/ui/layered-network-view/`: `overview-light.png`,
> `application-field-groups-light.png`, `focused-dark.png`, and
> `narrow-layout.png`; `focused-local-backward-routing-light.png` records the
> bounded local backward-edge routing refinement. The 4.8-second
> `focus-group-depth.webm` records the interaction sequence.
> `uniform-column-spacing-light.png` records the shared-height column spacing.
> Every column shares one vertical extent and distributes its entries evenly
> within that span, while deterministic order and Application grouping remain
> unchanged.

## Purpose

Add a complementary Atlas layout that reveals how mathematical structure
travels into methods, behavior, and practical use. The view should read from
left to right like a layered network while remaining an honest projection of
the existing typed graph rather than inventing a causal pipeline.

The working product name is **Structure to Use** and the working route is:

```text
#/atlas?layout=flow
```

This belongs in the Atlas layout family alongside the Bridge Atlas and concept
constellation. It is not a replacement for either:

- the concept constellation answers **what is near this concept?**;
- the Bridge Atlas answers **which graph communities exchange structure?**;
- Structure to Use answers **how does structure connect to methods, behavior,
  and applications?**

## Design thesis

The useful abstraction is not literally `Idea → Algorithm → Application`.
Existing node types describe ontological classes, and existing edges include
hierarchy, equivalence, assumptions, approximation, migration, and failure.
Forcing every claim into a pipeline would reverse or overstate some of those
semantics.

Instead, use five **presentation roles**:

```text
Foundation → Form → Method → Behavior → Application
```

These roles arrange the current ontology without changing it.

| Presentation layer | Existing node types | Question answered |
| --- | --- | --- |
| Foundation | `object`, `principle` | What structure or constraint is recognized? |
| Form | `model`, `operation`, `dialect` | In what model, representation, or field formulation does it appear? |
| Method | `move`, `theorem` | What reusable machinery acts on it or licenses a solution? |
| Behavior | `phenomenon` | What recurring behavior or consequence does it explain? |
| Application | `application` | Where is the structure materially used? |

The mapping is a renderer-owned projection. It must not alter
`graph/schema.yaml`, node front matter, or emitted `node_type` values.

## Semantic rules

### Preserve claim direction

Every rendered arrow keeps the source and target encoded in `graph.json`.
Never reverse a claim merely to make it point left to right. A relation may:

- connect adjacent layers;
- skip one or more layers;
- stay within one layer; or
- point back toward an earlier layer.

Forward cross-layer claims use the normal target arrowhead. Backward claims
should bow above or below the columns so the reversal is visible rather than
hidden in an overlapping line. Symmetric claims remain markerless and must not
be presented as flow.

### Edge families

The first view should classify existing edge types into presentation bands,
without changing their stored type or strength.

**Primary flow claims** are visible in the default layer view:

- `REPRESENTED-BY`
- `EXPOSES`
- `SYMMETRY-SELECTS-REPRESENTATION`
- `SOLVED-BY`
- `APPLIED-IN`
- `GOVERNS`
- `MEASURES-DISTANCE-TO`
- `MIGRATED-TO`

**Structural context claims** remain available through focus, filtering, and
the readable claim list:

- `IS-A`
- `APPROXIMATES`
- `LIMIT-OF`
- `CONTINUUM-LIMIT-OF`
- `ASSUMES`
- `FAILS-WHEN`
- `REPLACED-BY`
- `POSSIBLE-MISSING-MIGRATION`

**Equivalence and duality claims** are local cross-links rather than flow:

- `FIELD-DIALECT-OF`
- `SAME-SKELETON`
- `ANALOGOUS-TO`
- `TRANSFORM-DUAL`
- `LOCAL-GLOBAL-DUAL`

When visible, these links retain the existing symmetric-edge semantics and
strength grammar. They may be visually quieter than primary flow claims, but
their full sentences must remain available.

### Preserve epistemic strength

Solid/dashed/dotted and strong/medium/light styling continues to encode edge
strength. Field or group color must never replace that grammar. Gap claims
remain visibly distinct and retain their status language.

## Layout model

### Column geometry

Give each presentation layer a fixed x-coordinate. Compute y-order
deterministically from the complete trusted graph before applying view filters.
Filtering or focus may hide and emphasize nodes, but must not make remaining
nodes jump to new positions.

Begin with a small dependency-free crossing-reduction helper:

1. place nodes in their mapped layer;
2. seed each layer by canonical name and slug;
3. perform a fixed number of left-to-right and right-to-left median sweeps over
   trusted primary-flow neighbors;
4. break every tie by slug;
5. keep the resulting order stable for the lifetime of the view.

This is a deterministic layered projection, not force physics. It does not
read or mutate `metrics.layout`; those coordinates remain authoritative for
the concept constellation and concept minimaps only.

### Long, local, and backward connections

- Adjacent-layer claims use restrained curves or straight segments.
- Claims that skip layers may pass through reserved inter-column channels.
- Same-layer claims bow locally beside their column.
- Backward claims use a separate upper or lower routing channel.
- Parallel claims between the same nodes bow apart and remain individually
  focusable.

Do not route a line through a node mark or label. Use the established haloed
target arrowhead and focus/context hierarchy where applicable.

### Density strategy

The complete graph is too dense for every individual claim to compete at full
contrast. The first slice should use the same attention principle as the
focused Atlas:

- overview nodes remain visible as geographic context within their columns;
- primary-flow edges are restrained at rest;
- selecting a node promotes its incident claims and a bounded one- or two-hop
  context;
- unrelated lines recede but remain recoverable through filters and text;
- hover and keyboard focus promote the same edge and readable caption; and
- no interaction changes node order or claim membership silently.

Aggregate ribbons or bundled edge counts may be added later, but the first
slice should prove the individual-claim semantics before introducing
aggregation.

## Application grouping and supersets

The Application layer should group nodes by field because that makes repeated
use across disciplines visible. In the first slice:

- use the first declared field as the placement group;
- show all declared fields in the node's accessible name or inspection detail;
- label every group directly, so color is supplemental;
- sort groups by field label and nodes deterministically within each group; and
- provide `group=field|community|none` as URL-backed presentation state, with
  `field` as the default.

The existing graph has flat `fields` and build-emitted trusted communities. It
does not yet define broader field families. Do not invent families such as
“physical sciences” or “information sciences” inside renderer code.

If nested supersets prove useful, add a curated `field_families` vocabulary to
`graph/schema.yaml` in a separate schema task. That task must define labels,
membership, validation, emitted data, migration notes, and behavior for a field
that belongs to more than one family.

## Interaction model

### Required first-slice interaction

- Selecting a node focuses it inside the layered view.
- Depth controls reuse the Atlas `1 hop`, `2 hop`, and `All` vocabulary.
- Focus and depth live in the URL and survive reload.
- Hovering or keyboard-focusing a node reveals its full label and summary.
- Hovering or keyboard-focusing an edge emphasizes it and updates the live
  caption with the full typed claim.
- The inspector groups visible claims as incoming, outgoing, symmetric, and
  between-neighbor context, reusing existing claim components.
- Inspector actions link to the concept page, path view, compare view, matrix,
  and concept constellation focus.
- A visible layout switch returns to the Bridge Atlas or concept constellation.

### Useful later interaction

- Collapse an application field group into one aggregate mark with an exact
  claim count.
- Select a layer-to-layer bundle and inspect every underlying claim.
- Filter by field, edge type, node type, and strength using the existing Lens
  vocabulary.
- Compare two application groups to see shared upstream machinery.
- Highlight complete Foundation-to-Application chains through a selected node.

These are follow-ups, not permission to broaden the first slice silently.

## URL contract

Prefer the existing Atlas route and parser:

```text
#/atlas?layout=flow
#/atlas?layout=flow&focus=<slug>&depth=1
#/atlas?layout=flow&focus=<slug>&depth=2&group=field
```

Unknown layout or grouping values should degrade to an existing safe Atlas
state. Do not create history entries for transient hover or keyboard focus.

If filters are included, reuse the existing `field`, `edge`, `type`, and
`strength` parameter names and validation. Do not create a second filter
grammar.

## Accessibility and readable equivalents

- Columns and application groups need visible headings and semantic accessible
  names.
- Every SVG node remains a real focusable link or button with its full name.
- Every visible edge remains keyboard focusable and exposes its full sentence.
- A text section repeats every currently visible claim using the shared claim
  renderer and evidence affordances.
- Direction must be communicated by arrowheads and sentence phrasing, not
  color.
- Layer and field group identity must be communicated by headings and labels,
  not color alone.
- Focus order should follow the visual reading order: layer by layer, top to
  bottom, followed by the inspector.
- Narrow layouts may become horizontally scrollable only within the graph
  surface; controls and the inspector must remain usable without page-level
  horizontal overflow.
- Light and dark themes must remain axe-clean.

## Architecture boundaries

- Implement this as a new Atlas layout module, likely
  `app/src/views/atlas/flow.ts`, with pure helpers in a neighboring module.
- Reuse `svgEl`, shared marker definitions, badges, claim sentences, the Atlas
  inspector grammar, focus/depth selection, and camera patterns where they fit.
- Keep the Bridge Atlas and concept constellation renderers separate; do not
  add flow-specific branches throughout both renderers.
- Do not add a runtime dependency or rendering framework.
- Do not run force simulation in the browser.
- Do not alter graph claims, node types, fields, communities, or
  `metrics.layout`.
- If deterministic ordering is expensive or reused by other consumers, move it
  to the build pipeline in a later additive `graph.json` version rather than
  creating hidden persistence in the client.

## Implementation sequence

1. Add pure node-to-layer and edge-presentation classifiers with unit tests.
2. Add URL parsing/serialization for `layout=flow`, focus, depth, and optional
   grouping.
3. Implement deterministic column and row geometry over the trusted graph.
4. Render accessible nodes, exact directed/symmetric claims, and readable text.
5. Add focus-aware incident/context emphasis and inspection actions.
6. Add application field grouping and direct labels.
7. Add responsive behavior and camera/overflow handling without relayout.
8. Update architecture, graph-view, and Atlas roadmap documentation.
9. Capture representative light, dark, focused, and narrow UI evidence.
10. Run the focused tests, all relevant Atlas Playwright suites,
    `npm run check`, and `npm run budget`.

## First-slice acceptance criteria

- Every node included by the trusted-graph selection maps deterministically to
  exactly one of the five presentation layers without changing its stored node
  type.
- The same graph input produces byte-stable layer assignment and row ordering.
- Primary-flow claims retain their exact stored source, target, type, strength,
  and symmetric semantics.
- Long, same-layer, and backward claims are readable and are never silently
  reversed or dropped from the textual equivalent.
- Application nodes are grouped and labeled by existing field data; nodes with
  multiple fields disclose all of them.
- Focus, depth, grouping, and layout state round-trip through the URL.
- Node selection and edge hover/keyboard focus provide equivalent readable and
  visual feedback.
- The inspector and claim list expose every claim currently drawn.
- The concept constellation, Bridge Atlas, concept minimaps, and
  `metrics.layout` coordinates do not regress.
- The view works in light and dark themes and at supported narrow widths with
  no critical axe violations.
- No runtime dependency is added.
- Unit tests, relevant Atlas Playwright suites, `npm run check`, and
  `npm run budget` pass.
- Current screenshots and an interaction recording are stored under
  `artifacts/ui/layered-network-view/` and inspected before delivery.

## Explicit non-goals for the first slice

- No neural-network inference metaphor, weights, activation, or animation.
- No claim-direction normalization to manufacture left-to-right flow.
- No new node or edge ontology.
- No inferred field-family taxonomy.
- No force-directed layout or mutation of `metrics.layout`.
- No aggregate ribbon whose underlying claims cannot be inspected exactly.
- No replacement of the Lens, matrix, Bridge Atlas, or concept constellation.

## Follow-up decisions to record after the first slice

- Whether the product label should be `Flow`, `Structure to Use`, or another
  term after visual review.
- Whether deterministic order belongs in the client or an additive build
  metric.
- Whether application field groups need curated nested families.
- Whether aggregate bundles materially improve overview legibility without
  concealing edge strength or direction.
- Whether complete chain highlighting should become a separate path-oriented
  mode rather than another state in this view.
