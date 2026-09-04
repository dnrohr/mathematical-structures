# graph.json — the public dataset artifact

`graph.json` is the compiled, validated form of the Structure Atlas content
layer, emitted by `atlas-build` (ARCHITECTURE.md §4). It is the **only** input
the app reads, and it is a public artifact: external tools (notebooks,
scripts, network-analysis software) are welcome to consume it directly.

Build it locally with:

```sh
npm install
npm run build        # writes dist/data/graph.json and dist/data/search-index.json
```

## Versioning policy

The top-level `schema_version` is semver for the *artifact shape* (it is
unrelated to the content vocabulary in `graph/schema.yaml`):

- **Additive** changes (new optional keys) bump the **minor** version.
- **Breaking** changes (renamed/removed keys, changed meanings) bump the
  **major** version and come with a migration note in this file.
- Consumers should accept any artifact whose major version they understand.

Output is deterministic: the same content tree produces byte-identical
artifacts (object keys sorted, no timestamps), so the file is diffable and
citable. `generated_from` carries the git commit SHA of the content tree.

## Top-level shape (version 1.x)

```jsonc
{
  "schema_version": "1.0.0",
  "generated_from": "<git sha>",
  "schema": { /* the controlled vocabularies, verbatim from graph/schema.yaml */
    "node_types":   [ { "id", "label", "color_token", "description" } ],
    "edge_types":   [ { "id", "label", "group", "directionality",
                        "forward"?, "reverse"?, "phrase"?, "description", "example"? } ],
    "strengths":    [ { "id", "rank", "line", "emphasis", "description" } ],
    "fields":       [ { "id", "label" } ],
    "node_statuses":[ { "id", "description" } ],
    "gap_statuses": [ { "id", "description" } ],
    "analysis":     { "trusted_min_strength" }
  },
  "nodes":    [ /* sorted by slug */ ],
  "edges":    [ /* sorted by (from, to, type) */ ],
  "symptoms": [ /* sorted by id */ ]
}
```

### Node

```jsonc
{
  "slug": "eigenvalues",                  // permanent primary key
  "canonical_name": "Eigenvalues and spectral decomposition",
  "node_type": "operation",               // -> schema.node_types
  "status": "established",                // -> schema.node_statuses
  "summary": "Which directions ...",
  "fields": ["control", "statistics"],    // -> schema.fields
  "aliases": [ { "name": "poles", "field": "control" } ],
  "assumptions": ["linearity"],
  "canonical_examples": ["..."],
  "sections": ["notebook-v0#12"],         // provenance pointers
  "html": "<p>...</p>",                   // rendered body; raw HTML was escaped,
                                          // KaTeX pre-rendered, wiki-links are
                                          // <a href="#/c/<slug>"> anchors
  "backlinks": ["markov-chains"],         // slugs whose bodies wiki-link here
  "connections": [                        // this node's edges, both directions,
    {                                     // with display phrasings resolved
      "other": "markov-chains",
      "type": "FIELD-DIALECT-OF",
      "direction": "sym",                 // "out" | "in" | "sym"
      "phrase": "is a field dialect of",
      "strength": "strong-analogy",
      "context"?: "...", "status"?: "...", "notes"?: "..."
    }
  ]
}
```

### Edge

```jsonc
{
  "from": "linear-gaussian-ssm",
  "to": "state-space-model",
  "type": "IS-A",                 // -> schema.edge_types
  "strength": "theorem",          // -> schema.strengths
  "symmetric": false,             // from the edge type's directionality
  "context"?: "exact",
  "status"?: "open-candidate",    // gap workflow state; present on
                                  // POSSIBLE-MISSING-MIGRATION / speculative edges
  "notes"?: "...",
  "evidence": []                  // reserved for citation keys
}
```

Directed edges read `from → to` with the type's `forward` phrasing.
An edge's epistemic weight is `strength` — consumers must not present
`speculative` or analogy-strength edges as established relationships
(SPECIFICATION.md §3.2).

### Symptom

```jsonc
{
  "id": "too-many-parameters",
  "symptom": "Too many dimensional parameters",
  "moves": ["dimensional-analysis"],      // node slugs, most useful first
  "mature_fields": ["fluids"],            // -> schema.fields
  "worked_example"?: "reynolds-number"    // node slug
}
```

## search-index.json

A prebuilt [MiniSearch](https://github.com/lucaong/minisearch) index over
nodes and symptoms: `{ schema_version, options, index }`. Rebuild a searcher
with `MiniSearch.loadJSON(JSON.stringify(payload.index), options)` using the
embedded `options` (minus `boost`, which is the recommended search-time boost —
aliases score highest so reverse-dialect lookup works). Documents carry
`id` (node slug, or `symptom:<id>`), `kind`, and `name`.

## Consumption example (Python)

```python
import json, itertools

atlas = json.load(open("dist/data/graph.json"))
nodes = {n["slug"]: n for n in atlas["nodes"]}

# strongest cross-field identifications
for e in atlas["edges"]:
    if e["type"] == "FIELD-DIALECT-OF":
        print(nodes[e["from"]]["canonical_name"], "<->", nodes[e["to"]]["canonical_name"])

# open research-gap candidates
for e in atlas["edges"]:
    if e["type"] == "POSSIBLE-MISSING-MIGRATION":
        print(e["from"], "->", e["to"], f"[{e.get('status')}]")
```

Planned for M5: a `metrics` block (centrality, communities, span entropy —
computed only over edges at or above `schema.analysis.trusted_min_strength`)
and GraphML/CSV exports. Both will be additive (minor version).
