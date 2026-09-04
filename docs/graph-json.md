# graph.json — the public dataset artifact

`graph.json` is the compiled, validated form of the Structure Atlas content
layer, emitted by `atlas-build` (ARCHITECTURE.md §4). It is the **only** input
the app reads, and it is a public artifact: external tools (notebooks,
scripts, network-analysis software) are welcome to consume it directly.

Build it locally with:

```sh
npm install
npm run build:data   # writes dist/data/graph.json and dist/data/search-index.json
                     # (npm run build additionally builds the app around them)
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
  "schema_version": "1.1.0",
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
  "symptoms": [ /* sorted by id */ ],
  "metrics":  { /* build-time analysis; added in 1.1.0 — see below */ }
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

### Metrics (added in 1.1.0)

Build-time analysis (ARCHITECTURE.md §4.4). **Epistemic rule:** degree,
betweenness, and communities are computed only over the *trusted subgraph* —
edges whose strength is at or above `schema.analysis.trusted_min_strength`
(`special-case` today) — so speculative analogies cannot manufacture
centrality. Nodes reached only by analogy-strength or speculative edges have
`degree` 0 and `community` null.

```jsonc
{
  "trusted": {
    "min_strength": "special-case",
    "edge_count": 60,             // edges at or above the floor
    "excluded_edge_count": 24,    // edges below it (unused by metrics)
    "node_count": 34              // nodes touched by ≥1 trusted edge
  },
  "community_count": 5,
  "nodes": {                      // one entry per node, keyed by slug
    "eigenvalues": {
      "degree": 11,               // incident trusted edges
      "betweenness": 0.3983,      // Brandes, normalized to [0,1], 4 decimals
      "community": 0,             // deterministic Louvain label, or null
      "span_entropy": 2.807,      // bits: log2(field_count) until usage is weighted
      "field_count": 7,
      "dialect_count": 5          // distinct fields among aliases
    }
  },
  "gaps": [                       // every POSSIBLE-MISSING-MIGRATION or
    {                             // speculative edge, with workflow status
      "from": "stability-margins",
      "to": "biological-regulation",
      "type": "POSSIBLE-MISSING-MIGRATION",
      "strength": "speculative",
      "status": "open-candidate"
    }
  ],
  "candidate_edges": [            // wiki-linked pairs with no typed edge
    { "a": "chaos", "b": "phase-space" }   // (the curation queue), a < b
  ]
}
```

## Exports: GraphML and CSV (added in 1.1.0)

`atlas-build` writes three more artifacts next to `graph.json`, for
network-analysis tools and spreadsheets:

- **`atlas.graphml`** — nodes with `label`, `node_type`, `status`, `fields`
  (semicolon-joined) and the per-node metrics; edges with `type`, `strength`,
  `symmetric`, `gap_status`, `context`, `notes`. Every edge is emitted in its
  stored direction with `symmetric` as an attribute (mixed-directedness
  GraphML is rejected by common readers); symmetrize on load if your analysis
  wants an undirected view.
- **`nodes.csv` / `edges.csv`** — RFC 4180, one row per node/edge, metrics
  included; multi-valued fields are semicolon-joined.

The live app links all four files from its Metrics page ("Download the
dataset").

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

# the busiest bridges, from the precomputed trusted-subgraph metrics
ranked = sorted(atlas["metrics"]["nodes"].items(),
                key=lambda kv: -kv[1]["betweenness"])
for slug, m in ranked[:5]:
    print(slug, m["betweenness"], "community", m["community"])
```
