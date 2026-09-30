# Atlas Visualization Roadmap

> Updated 2026-09-30. The graph workspace/focus slice, deterministic Bridge
> Atlas overview, scale-aware camera foundation, and connection-legibility
> hierarchy are implemented. Broader semantic level-of-detail remains below.

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

At the time of this update the built atlas contains 144 concepts, 312 claims,
123 positioned concepts, 247 trusted claims, and 7 communities. The project is
therefore already at the documented community-aggregation transition rather
than merely approaching it.

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

The concept-map mode currently draws all 123 positioned concepts and all 247
trusted claims in one fixed constellation. The camera now provides bounded
wheel zoom, empty-canvas pointer pan, fit controls, and transient preservation
without changing those deterministic coordinates. Node labels are hidden
until focus or hover, but the dense center can still read as a hairball because
the constellation does not yet vary its visual density with scale. The
separate Bridge Atlas provides the community-level overview.

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

## Architecture assessment

The current architecture supports this work cleanly. `metrics.layout` is
already the sole spatial authority, and the Atlas is hand-written SVG with
separate edge and node layers. Pan and zoom can therefore be implemented as a
uniform transform on one inner SVG group. This is a camera operation only: it
does not run force physics, recompute positions, mutate `metrics.layout`, or
change any mathematical claim.

No rendering-framework or WebGL migration is warranted at the present scale.
The repository also has an explicit no-new-runtime-dependency posture, so the
first camera implementation should use native wheel and pointer events rather
than add `d3-zoom`.

Hash navigation reconstructs a view, and the `View` interface has no teardown
callback. The implemented camera therefore keeps its listeners on the
discarded SVG, where garbage collection is sufficient, and uses a small
module-level cache to retain presentation state across Atlas focus, depth, and
color route changes. It does not install window-level listeners or a
`ResizeObserver`. If a later slice requires either, add an optional view
disposal hook and invoke it before the shell replaces the current view.

## Scale strategy

There are two independent forms of scale and both need an explicit response:

1. **Dataset scale.** As the graph grows, the default survey surface must move
   from individual concepts to communities. The implemented Bridge Atlas is
   the correct default overview at the current 144-node size. The complete
   concept constellation remains an explicit exploration mode, and focused
   concept URLs continue to open directly into that mode.
2. **Camera scale.** Within the concept constellation, zoom must reveal detail
   instead of merely enlarging clutter. Marks, labels, and edges should use
   deterministic levels of detail while coordinates remain fixed.

The recommended attention bands are:

| Band | Presentation |
| --- | --- |
| Survey | Community territories, landmark names, and aggregate bridge counts in the Bridge Atlas. |
| Concept fit | All positioned concept dots; a subdued structural edge field; landmark, hovered, focused, and keyboard-focused labels only. |
| Close concept view | Stronger local edges and additional deterministic labels chosen by focus, community-landmark status, then centrality and slug. |
| Focused concept | The existing capped one- or two-hop trusted neighborhood takes precedence; unrelated context remains faint. |

Do not silently morph the Bridge Atlas into the concept constellation during a
wheel gesture. They answer different questions and have different visual
semantics, so the transition should be an explicit `Overview` / `Explore
concepts` control. Within the concept view, visual suppression must be
disclosed (for example, “labels and non-local edges are reduced at this
scale”), and all claims remain available through the inspector, live caption,
or existing textual views.

The preferred route migration is to make the community overview the Atlas
navigation destination while retaining a canonical explicit concept layout.
Bare and previously shared focused URLs must remain valid. Final query names
should be settled with the router tests; camera position remains transient and
must not enter the URL.

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

## Stage 3: Scale-aware camera and concept detail

Overview and focus states are now stable enough for camera navigation. Deliver
the camera before optional minimap work so the smallest useful interaction
slice stays reviewable.

### Camera foundation delivery status

The first camera slice is implemented in
`app/src/views/atlas/camera.ts` and `app/src/views/atlas/index.ts`:

- one inner `atlas-camera` group applies a bounded uniform transform while
  every node retains its exact build-time `metrics.layout` translation;
- wheel/trackpad input zooms around the pointer from `0.5x` through `6x`, and
  empty-canvas pointer drags pan within a modest overscroll boundary;
- a movement threshold separates click from drag, dragged nodes do not
  navigate accidentally, pointer capture stabilizes canvas drags, and Escape
  cancels the active pan;
- visible `Zoom in`, `Zoom out`, and `Fit constellation` buttons plus a live
  zoom/focus status provide the keyboard and assistive-technology path;
- a module-memory camera cache survives focus, depth, and color-mode route
  rebuilds; `Fit` and full reload return to the deterministic fitted view; and
- camera math has unit coverage, while Playwright covers wheel zoom, pan,
  click-versus-drag, controls, accessibility, preservation, reload, and fixed
  node coordinates.

No runtime dependency was added. Semantic detail remains the next item in this
stage.

Current UI evidence is stored at
`artifacts/ui/atlas-camera/scale-aware-camera-desktop.png`; the companion
`zoom-pan-fit.webm` records the zoom, empty-canvas pan, and deterministic fit
interaction at 1440 × 900.

### Connection legibility delivery status

The Atlas now derives an explicit attention state for every visible claim:
unfocused overview, directed outgoing focus, directed incoming focus,
symmetric focus adjacency, or between-neighbor context. Focused incident
claims use a common high-contrast treatment while context claims recede;
hover and keyboard focus promote either tier and continue to announce the full
claim in the live caption. Direction is still carried by the target arrowhead
and by the inspector's Incoming/Outgoing text, not by a color code.

Directed claims use a longer, narrower filled triangle with a raised-background
halo. The tip remains on the trimmed target-rim path endpoint and follows the
final tangent of straight and bowed paths. Symmetric claims remain markerless,
and solid/dashed/dotted plus strong/medium/light strength styling remains
intact. Marker width and height are inversely compensated within the existing
`0.5x`–`6x` camera bounds, so the head stays approximately `10 × 8` screen
pixels without rewriting the camera transform, path coordinates, or any
`metrics.layout` node translation.

Unit tests cover all attention states and marker compensation at minimum,
normal, intermediate, and maximum zoom. The focused Playwright suite covers
incident/context rendering, directed versus symmetric semantics, hover and
keyboard parity, readable captions, light/dark accessibility, camera/depth
preservation, and byte-stable node translations. Current evidence lives in
`artifacts/ui/atlas-connection-legibility/` at focused fit, focused close zoom,
and narrow viewport sizes. No runtime dependency was added.

### Camera work

- Wrap the existing edge and node layers in one inner
  `<g class="atlas-camera">` and apply a uniform translate/scale transform to
  that group only.
- Support mouse-wheel and trackpad zoom centered on the pointer.
- Pan by dragging empty canvas space. Use pointer capture so the gesture
  remains stable when the pointer leaves the SVG.
- Use a short movement threshold to distinguish a drag from a click. Dragging
  must not accidentally activate a concept or claim link, and node clicks must
  retain their existing behavior.
- Bound zoom to a practical range (begin with approximately `0.5x` to `6x`)
  and constrain extreme panning while allowing modest overscroll.
- Add visible `Zoom in`, `Zoom out`, and `Fit` controls. These are the keyboard
  and assistive-technology path; mouse gestures are an enhancement.
- Show an accessible camera status such as `150%, focused on Eigenvalues`.
- Use grab/grabbing cursor feedback and allow `Escape` to cancel an active
  drag.
- Preserve the camera in session memory while focus, depth, or color mode
  changes rebuild the Atlas view. A reload returns to deterministic fit.
- Ensure camera input never starts force simulation or changes build-time
  coordinates.
- Keep the inspection panel and toolbar outside the transformed SVG.
- Respect `prefers-reduced-motion`; the first slice may use immediate
  transforms and does not require animation.

### Semantic detail work

- Derive a deterministic attention band from the camera scale.
- Keep focused, hovered, and keyboard-focused marks fully legible in every
  band.
- At fit scale, reduce the visual dominance of the complete edge field and
  keep only prioritized labels visible.
- At closer scales, strengthen local edges and admit additional labels in a
  deterministic order. If collision suppression is needed, use a stable
  screen-space grid rather than layout physics.
- Keep SVG strokes readable with `vector-effect="non-scaling-stroke"` where
  appropriate. Avoid allowing labels or hit targets to become unusably small.
- State when edges or labels are visually suppressed. Suppression changes
  attention only; it must not change the inspector's claims or imply that a
  hidden claim is absent.

### Optional follow-up: minimap and touch

- Add a minimap drawn from the same fixed coordinates only after the camera
  interaction is proven useful.
- Display the current viewport rectangle and allow minimap selection to
  recenter the main camera.
- Add two-pointer pinch support through the same camera model. Do not block the
  requested mouse interaction on this follow-up.

A small dependency-free camera module with pure transform/clamping helpers is
preferable to embedding camera math in the view or introducing another runtime
package.

### Acceptance criteria

- Zoom is bounded and uniform; spatial relationships are never distorted.
- Reset yields the same camera state every time.
- Mouse/trackpad, pointer-drag, and visible keyboard-operable controls work.
- Zoom keeps the graph coordinate under the pointer stationary within normal
  floating-point tolerance.
- Dragging empty space changes the camera; dragging or clicking a node does not
  corrupt node navigation.
- Focus and depth changes preserve the in-memory camera; reload and `Fit`
  produce a deterministic fitted camera.
- Controls do not obscure the graph at supported viewport widths.
- Reduced-motion users do not receive animated camera transitions.
- Existing `metrics.layout` coordinates and concept minimaps remain unchanged.
- Every visually suppressed claim is still recoverable as readable text.

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
3. **Camera foundation** — wheel/trackpad zoom, pointer pan, controls,
   bounds, session preservation, accessibility, and tests.
4. **Semantic detail** — scale bands, deterministic labels, edge emphasis,
   and disclosure of suppressed detail.
5. **Optional minimap and touch** — viewport rectangle, recentering, and pinch
   gestures after the mouse camera is stable.
6. **Filters and first alternate layout** — shared filter grammar and community
   islands. Add later layouts in separate follow-up changes.

Each pull request must leave `#/atlas` complete and usable. Avoid long-lived
parallel renderers. If a temporary compatibility path is needed, keep it behind
an explicit query parameter and remove it when the next stage lands.

## Verification

Extend the existing Atlas tests rather than creating an unrelated suite.

Every stage should include, as applicable:

- Unit tests for URL state parsing and serialization.
- Unit tests for camera transforms, pointer-centered zoom, fit calculations,
  and clamping.
- Unit tests for trusted neighborhood selection and caps.
- Build tests for deterministic community metrics and layouts.
- End-to-end tests for focus, depth, community, filters, layouts, and reloads.
- End-to-end tests for wheel zoom, pointer pan, click-versus-drag behavior,
  visible camera controls, fit/reset, and camera preservation across Atlas
  route changes.
- Exact node and edge counts checked against `graph.json`.
- Keyboard navigation and focus-management tests.
- Axe checks in light and dark themes.
- Visual evidence at desktop, tablet, and narrow mobile widths.
- Confirmation that every visible claim is available in readable text.
- `npm run check` and the full Playwright suite.
- The existing JavaScript bundle-budget check.

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

## Next implementation slice

Add semantic detail bands on top of the delivered camera foundation. Keep
focused and keyboard-focused marks legible, choose additional labels
deterministically, disclose visual suppression, and preserve the inspector's
complete readable claims. Optional minimap viewport controls and pinch input
remain later follow-ups.
