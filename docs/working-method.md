# Working method for concept nodes

(Moved from the original notebook, §7; the notebook is preserved intact at
[notebook-v0.md](notebook-v0.md).)

For each candidate node, record:

1. **What it is** — a concise structural definition, phrased as the question the
   structure answers where possible.
2. **What kind of thing it is** — its ontological class (`node_type` in
   `graph/schema.yaml`): object, operation, model, principle, phenomenon, move,
   theorem, dialect, or application.
3. **Its direct mathematical connections** — as typed edges in
   `graph/edges.yaml`, each with an honest strength.
4. **Canonical problems it solves or illuminates.**
5. **Surprising reappearances across fields** — recorded as aliases (dialect
   names per field) and cross-field edges.
6. **One or two memorable examples** — `canonical_examples` in front-matter.

Do this for roughly 20–30 nodes before imposing any final hierarchy; the graph
views (SPECIFICATION.md §3.3) exist precisely so no single hierarchy has to be
chosen.

Practical rules that emerged:

- Prefer depth over breadth: a richly connected node beats three stubs
  (SPECIFICATION.md §9).
- A `stub` node is legal and visible as such — honesty over completeness.
- When a write-up keeps wanting to state *when the tool breaks*, that is an
  ASSUMES / FAILS-WHEN / REPLACED-BY edge trying to exist; record it as data,
  not prose.
