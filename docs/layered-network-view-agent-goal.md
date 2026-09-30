# Agent Goal: Deliver the Structure-to-Use Layered Network View

Implement the first shippable slice described in
[`docs/layered-network-view.md`](layered-network-view.md).

Add a third Atlas layout at `#/atlas?layout=flow` that projects the existing
trusted graph into five deterministic columns:

```text
Foundation → Form → Method → Behavior → Application
```

Map existing node types into those presentation roles without changing the
ontology. Preserve every claim's stored source, target, edge type, strength,
and symmetric semantics; allow long, same-layer, and visibly routed backward
connections rather than reversing claims to manufacture left-to-right flow.
Group Application nodes by existing field data, label groups directly, and
provide URL-backed `field` (default), `community`, and `none` modes.
Do not invent broader field families.

Reuse the Atlas focus/depth model, URL state, shared claim rendering,
arrowheads, strength grammar, accessible live caption, inspection actions, and
light/dark themes. Use a dependency-free deterministic layered layout with
stable tie-breaking and no client-side force physics. Filtering or focus may
change emphasis and visibility but must not reorder the remaining nodes.

Keep `metrics.layout`, the concept constellation, Bridge Atlas, concept
minimaps, graph content, and saved semantics unchanged. Do not add a runtime
dependency, a new ontology, inferred field supersets, or opaque edge bundles.

Add unit coverage for layer assignment, edge presentation, deterministic
ordering, and URL serialization. Add Playwright coverage for directed and
symmetric claims, long/backward routing, focus/depth preservation, application
field grouping, hover/keyboard parity, readable claim equivalents, responsive
layout, and light/dark accessibility. Update the relevant architecture and
Atlas roadmap documentation, and capture inspected screenshots plus a short
interaction recording under `artifacts/ui/layered-network-view/`.

Before delivery, pass:

```text
npm run check
the relevant Atlas Playwright suites
npm run budget
```

Treat every acceptance criterion and non-goal in the implementation brief as
part of this goal. Deliver the scoped slice completely, review the final diff,
commit only task files, and publish through the repository's required-check PR
workflow.
