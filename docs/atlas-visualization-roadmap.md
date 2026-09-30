# Atlas Visualization Roadmap

## Bridge Atlas delivery status

The deterministic Bridge Atlas slice is implemented at
`#/atlas?layout=bridges` with the following boundaries:

- schema 1.6.0 carries normalized memberships, deterministic landmarks and
  territory paths, exact bridge edge indexes, distributions, and zero-pair
  frontiers;
- the read-only overview uses build geometry, compressed count widths, shared
  claim rendering, and complete community/bridge text equivalents;
- URL state covers layout, known-bridge/frontier mode, selected pair, and the
  existing node/field/edge/strength filter grammar;
- frontier language distinguishes global dataset absence from filter-induced
  absence and never pre-fills a proposed edge;
- territory expansion, zoom/camera controls, decorative coastline refinement,
  and animation remain later work.

## Purpose

This document defines how to evolve `#/atlas` from a document page containing
a complete graph into a graph-first exploration workspace. The interaction
model should borrow the strongest ideas from the sibling
`intellectual-history-knowledge-atlas` project while preserving this project's
more important constraints: deterministic layouts, citable URL state,
epistemically honest relationships, accessible text equivalents, and no
client-side layout physics for the full graph.

The central design principle is:

> The full graph provides geographic context; a small, semantically selected
> subgraph provides the active reading layer.

The work should be delivered as independently useful vertical slices. Do not
replace the renderer, data contract, navigation model, and layout system in one
large change.

## Current condition

The Atlas currently draws every positioned concept and every trusted claim in
one fixed constellation. At the present dataset size this means roughly 120
concepts and 200 claims. Although the coordinates are deterministic and node
labels are hidden until focus or hover, the dense center still reads as a
hairball. The explanatory material also pushes much of the graph below the
initial viewport.

The existing implementation nevertheless provides a strong foundation:

- `metrics.layout` gives every trusted concept a stable build-time position.
- `metrics.nodes[*].community` provides deterministic community membership.
- `egoNetwork` already implements bounded one- and two-hop selection.
- Lens and matrix views already implement the node-type, field, edge-type, and
  strength filter grammar.
- Shared edge-claim and citation fragments can supply readable equivalents for
  graph relationships.
- The existing Atlas end-to-end suite verifies layout fidelity, focus state,
  URL round-tripping, themes, and the concept minimap.

## Product model

The revised Atlas has three levels of attention:

1. **Overview** — community-level orientation with very little edge detail.
2. **Explore** — a selected concept's one- or two-hop trusted neighborhood.
3. **Inspect** — a concept or claim panel with readable claims, evidence, and
   onward actions.

The default state should be Overview. Selecting a community expands its
contents. Selecting a concept enters Explore without leaving the Atlas.
Opening the full concept page becomes an explicit action in Inspect.

The complete concept-level graph remains available as an explicit `All`
choice, but it is not the default reading surface.

## Interaction and URL contract

Meaningful view state belongs in the URL. A proposed contract is:

```text
#/atlas
#/atlas?community=3
#/atlas?focus=eigenvalues&depth=1
#/atlas?focus=eigenvalues&depth=2&edge=GOVERNS
#/atlas?layout=dependency&strength=theorem
```

Supported state should eventually include:

- `community=<id>` — expanded community.
- `focus=<slug>` — selected concept.
- `depth=1|2|all` — neighborhood depth; focused views default to `1`.
- `layout=constellation|community|kind|dependency` — deterministic spatial
  interpretation.
- `type=`, `field=`, `edge=`, and `strength=` — the existing Lens filter
  grammar.
- `communities=1` may remain as a backward-compatible alias while migrating to
  a clearer color-mode control.

Transient camera position should not initially be encoded in the URL. Zoom and
pan change the camera, not the underlying map or the claims being shown.

## Stage 0: Confirm the design contract

Before implementation, update `UI_REDESIGN.md` section 4.7 to record these
decisions:

- The Atlas is a graph-first workspace rather than a long document page.
- The default is a community-aggregated overview.
- Selecting a node first focuses it inside the Atlas.
- Full concept navigation is an explicit secondary action.
- Build-time coordinates remain the spatial authority.
- Zoom and pan are permitted camera operations and never alter stored layout.
- Every visible relationship remains recoverable as text.
- Community aggregation may only summarize actual trusted claims and must
  expose the claims behind every aggregate connection.

This stage prevents implementation from silently contradicting the repository's
current explicit prohibition on zoom and pan.

## Stage 1: Graph workspace and focus mode

This stage is client-only and should ship without changing `graph.json`.

### Work

- Make the Atlas canvas fill the available desktop workspace beneath the site
  header.
- Move the long introduction, counts, outside-node list, and scale note into a
  compact information disclosure below or beside the graph.
- Add a compact toolbar containing focus context, `1 hop`, `2 hop`, `All`,
  color mode, filters, and reset.
- Change concept marks from direct concept-page links to Atlas focus links:
  `#/atlas?focus=<slug>`.
- Reuse or generalize `egoNetwork` to select trusted one- and two-hop
  neighborhoods. Preserve its node cap and deterministic ordering.
- In a focused state, hide unrelated edges and strongly de-emphasize unrelated
  nodes while leaving enough context to preserve the reader's location.
- Add a concept inspection panel containing the concept summary, kind, fields,
  incoming and outgoing claims, and evidence.
- Reuse shared edge-claim and citation components rather than creating a second
  claim presentation grammar.
- Include explicit `Open concept`, `Find path`, and `Compare` actions.
- On narrow screens, present the inspection panel as an accessible dismissible
  sheet below the toolbar.

### Acceptance criteria

- The graph is visible above the fold at a typical desktop viewport.
- Selecting a node does not lose Atlas context.
- Reloading restores focus and depth from the URL.
- One-hop and two-hop views obey the bounded node cap.
- Every displayed edge is readable in the inspection panel or live caption.
- A keyboard user can select a concept, change depth, inspect claims, close the
  panel, and open the concept page.
- Existing fixed coordinates remain unchanged.
- Light and dark themes pass the existing accessibility gate.

## Stage 2: Community-aggregated overview

This stage changes build artifacts and should be treated as an additive data
schema minor release.

### Build work

Emit deterministic community-level presentation data, preferably under
`metrics.community_layout` and `metrics.communities`. For each community,
provide or deterministically derive:

- Stable position.
- Member count.
- Trusted internal-claim count.
- Trusted cross-community claim counts.
- A short list of landmark concepts ordered by trusted degree and slug.

The layout may begin from the centroid of member coordinates, but it must be
fitted deterministically and tested for byte-identical output. Community
connections must be derived exclusively from actual trusted claims.

### App work

- Render one sized mark per community in the default state.
- Label each mark with its community identifier and landmark concepts.
- Draw only cross-community connections in Overview, with counts.
- Selecting a community expands its members using their stable concept
  coordinates.
- Selecting an expanded member enters the Stage 1 focus state.
- Selecting an aggregate connection shows the exact claims summarized by it.
- Provide an explicit `All concepts` control for the complete constellation.

### Acceptance criteria

- The default graph contains exactly `community_count` community marks.
- Community membership and connection counts exactly match the trusted graph.
- No aggregate connection exists without at least one underlying trusted
  claim.
- The underlying claims are readable from the aggregate connection.
- Community selection survives reload through URL state.
- Every positioned concept can be reached within two selections.
- The complete constellation remains available but is no longer the default.

## Stage 3: Camera and minimap

Add camera navigation only after Overview and focus states are stable.

### Work

- Apply one uniform camera transform to an inner SVG graph group.
- Support bounded wheel zoom, drag pan, reset, and visible zoom-in and zoom-out
  controls.
- Ensure camera input never starts force simulation or changes build-time
  coordinates.
- Add a minimap drawn from the same fixed coordinates.
- Display the current viewport rectangle in the minimap.
- Allow minimap selection to recenter the main camera.
- Fit or reset the camera when the user changes community or focus context.
- Respect `prefers-reduced-motion` for animated camera transitions.

A small dedicated camera module is preferable to introducing a broad graphing
framework. A focused dependency such as `d3-zoom` is acceptable only if it
materially reduces accessibility and input-handling risk.

### Acceptance criteria

- Zoom is bounded and uniform; spatial relationships are never distorted.
- Reset yields the same camera state every time.
- Pointer, touch, and keyboard controls all work.
- The minimap viewport accurately represents the main camera.
- Controls do not obscure the graph at supported viewport widths.
- Reduced-motion users do not receive animated camera transitions.

## Stage 4: Filters and alternative layouts

Reuse the existing Lens filter vocabulary rather than creating Atlas-specific
filters. Place the full controls in a drawer and show active filters as compact,
removable toolbar controls.

Add alternative layouts one at a time, in this order:

1. **Community islands** — exposes local structure and bridges.
2. **Node-kind bands** — exposes relationships among models, principles,
   operations, moves, applications, and other node kinds.
3. **Dependency flow** — emphasizes directed assumption, governance, and
   tractability relationships.

Every layout must answer a distinct question, preserve focus and filters, and
remain deterministic. Any new layout computation belongs in the build layer
unless it is merely a display transform over existing emitted data.

### Acceptance criteria

- Atlas and Lens share filter semantics and validation.
- Filter state round-trips through the URL.
- Empty states explain which filters removed the graph and how to recover.
- Changing layout preserves the selected concept and active filters.
- Each layout has a documented interpretive question and build-layer tests.
- No spatial arrangement implies a claim that is absent from the edge list.

## Delivery structure

Use one reviewable pull request per stage after Stage 0:

1. **Atlas workspace and focus mode** — shell, neighborhood depth, inspection
   panel, URL state, accessibility.
2. **Community overview** — build artifact additions, aggregation renderer,
   community drill-down.
3. **Camera and minimap** — zoom, pan, fit/reset, responsive minimap.
4. **Filters and first alternate layout** — shared filter grammar and community
   islands. Add later layouts in separate follow-up changes.

Each pull request must leave `#/atlas` complete and usable. Avoid long-lived
parallel renderers. If a temporary compatibility path is needed, keep it behind
an explicit query parameter and remove it when the next stage lands.

## Verification

Extend the existing Atlas tests rather than creating an unrelated suite.

Every stage should include, as applicable:

- Unit tests for URL state parsing and serialization.
- Unit tests for trusted neighborhood selection and caps.
- Build tests for deterministic community metrics and layouts.
- End-to-end tests for focus, depth, community, filters, layouts, and reloads.
- Exact node and edge counts checked against `graph.json`.
- Keyboard navigation and focus-management tests.
- Axe checks in light and dark themes.
- Visual evidence at desktop, tablet, and narrow mobile widths.
- Confirmation that every visible claim is available in readable text.
- `npm run check` and the full Playwright suite.

Recommended visual QA sizes are approximately 1440×900, 768×1024, and
390×844.

## Success measures

The redesign succeeds when:

- A first-time reader can identify the major regions of the atlas without
  decoding the full concept-level graph.
- Selecting a concept produces a legible neighborhood rather than a denser
  hairball.
- Readers can inspect claims and evidence without repeatedly leaving and
  reconstructing their graph context.
- The same URL recreates the same meaningful graph state.
- Aggregate marks and layouts never overstate the underlying evidence.
- The fixed constellation remains recognizable across Overview, Explore,
  concept minimaps, and other graph views.

## Likely implementation risks

- **Two competing focus models.** Keep `focus=<slug>` as the single source of
  truth; the inspection panel is a rendering of that state, not separate local
  selection.
- **Aggregation implying unsupported structure.** Make aggregate connections
  selectable and enumerate their underlying claims.
- **Filter duplication.** Extract shared parsing and selection functions from
  Lens instead of copying them into Atlas.
- **Camera accessibility.** Provide visible controls and reset/fit actions;
  pointer gestures are enhancements, not the only controls.
- **Oversized pull requests.** Do not combine community metrics, camera input,
  filters, and three layouts in the first implementation change.
- **Regression of the concept minimap.** Continue drawing it from the canonical
  fixed concept coordinates, not the current Atlas camera or aggregate view.
