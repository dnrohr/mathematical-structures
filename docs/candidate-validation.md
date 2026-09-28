# Pre-admission candidate validation

## Overlap and integration note

This design is based on the current implementation, not only on the repository
documents. The pre-admission layer is a separate consumer of `atlas-build`; it
does not become another trusted-content compiler.

### Reuse directly

- `loadSchema` and `AtlasSchema` in `build/src/schema.ts` remain the only source
  of atlas node types, edge types, strengths, fields, and gap statuses.
- `parseTree` supplies the raw trusted concept, edge, reference, symptom, and
  walk records. `runPipeline` supplies the clean linked graph. Candidate
  validation stops if the trusted atlas itself has errors.
- `validateContent` is called through a narrow adapter for proposed trusted
  edges. This reuses endpoint, vocabulary, strength, gap-workflow, citation-key,
  and duplicate rules, including reversed duplicates for symmetric edge types.
- `linkGraph`'s `GraphNode`, `GraphEdge`, aliases, and wiki-link candidate pairs
  are the normalization index. Its deliberate non-edge ledger suppresses
  already-reviewed pairs, and `metrics.queue.link_suggestions` adds the current
  mechanical proposal queue. Matches always cite an atlas slug and the
  triggering canonical name, alias, acronym, or normalized spelling.
- `analyzeGraph` provides the existing degree, betweenness, community, field
  span, dialect count, gap, candidate-edge, and work-queue summaries used as
  graph-value inputs. Candidate claims are never inserted into those metrics.
- `APPLICATION_NODE_TYPE` and `APPLICATION_EDGE_TYPES` preserve the existing
  two-structure application bar. Candidate reports apply the same bar as a
  recommendation; final enforcement remains in the trusted validator.
- The node, edge, and gap issue templates, ordinary pull requests, and
  `npm run check` remain the promotion path and final gate.

### Narrow extraction or extension

- Candidate validation constructs in-memory `ConceptRecord` and `EdgeRecord`
  adapters, then filters the existing validator's results to the proposed
  records. No trusted rule is copied into the candidate implementation.
- Existing `NonEdgeRecord` entries are passed through the same adapter, so a
  proposal contradicting `graph/non-edges.yaml` is detected by the trusted
  `non-edge/contradiction` rule rather than by a competing admission rule.
- Name normalization is new but deliberately lexical: Unicode normalization,
  case folding, punctuation/whitespace folding, a small transparent plural
  normalization, and only explicitly supplied aliases/acronyms. Semantic
  similarity remains a recorded heuristic signal, never identity.
- Existing metrics are read, not recomputed with hypothetical nodes or edges.
  The prototype reports observable graph-value dimensions separately from
  evidence and truth.

### New components actually required

- A versioned YAML dossier contract under `admission/`, outside `concepts/`,
  `graph/`, and `paths/`.
- Deterministic dossier parsing, workflow/source-consistency rules,
  normalization, evidence-status checks, recommendation logic, and stable
  text/JSON report renderers.
- A separate `atlas-admit` CLI. It reads trusted content and dossiers but never
  writes trusted content or build artifacts.
- Source-inventory, triage, and evidence-pack adapters behind a
  recorded-judgment boundary. Their outputs remain untrusted, deterministic,
  and fully reviewable offline; they cannot write `concepts/`, `graph/`, or
  `paths/`.

No change to `graph/schema.yaml` or the trusted ontology is necessary. The
candidate workflow states and dispositions are admission-process vocabulary,
not atlas ontology; they are versioned with the dossier contract. Any future
attempt to promote them into trusted graph data is a separate schema decision
for human review.

## Boundary and data flow

```text
untrusted YAML dossier(s)
          |
          v
shape/provenance/workflow checks ---- graph/schema.yaml vocabulary lookup
          |                                      |
          v                                      v
lexical normalization <-------------- clean linked trusted atlas
          |
          +---- proposed-edge adapter ----> existing validateContent
          |
          +---- evidence and adversarial checks (recorded, never presumed)
          |
          +---- existing metrics, read-only graph-value signals
          v
stable review report (text or JSON) ---> human decision
                                           |
                                           v
ordinary issue/PR ---> trusted atlas validator ---> trusted graph artifacts
```

The deterministic CLIs never invoke a model. `atlas-harvest` expands recorded
source inventories, consolidates transparent lexical duplicates, compares
names with the trusted atlas, and emits normalized dossiers. `atlas-triage`
requires an exhaustive exactly-once classification and a bounded 30–50 item
review queue. `atlas-evidence` requires exactly one evidence-pack entry for
every selected candidate and records proposition-level source assessments and
adversarial reviews. These are still untrusted dossier facts: the core checks
their shape, provenance, and compatibility but never decides that they are
true.

```powershell
npm run harvest -- --manifest admission/campaigns/<id>/harvest.yaml --out admission/campaigns/<id>/normalized
npm run triage -- --campaign admission/campaigns/<id> --manifest admission/campaigns/<id>/triage.yaml
npm run evidence -- --campaign admission/campaigns/<id> --pack admission/campaigns/<id>/evidence-pack.yaml
npm run admit -- --format text admission/campaigns/<id>/normalized
npm run promotion-preview -- --campaign admission/campaigns/<id> --out admission/campaigns/<id>/promotion-preview
```

`atlas-promotion-preview` renders the exact proposed concept Markdown, typed
edges, and bibliography additions under `admission/`, then validates them in a
temporary combined content tree with the ordinary trusted compiler. It refuses
output paths inside trusted directories and marks its report as requiring
human approval. It is a review artifact, not a promotion command.

## Deterministic and heuristic checks

Deterministic checks cover YAML shape, ids, schema-derived vocabularies, source
references, evidence assessment fields, workflow transitions, exact/normalized
name matches, trusted-edge duplication, symmetric reversed duplication, and
byte-stable report ordering. A source assessment only counts as claim support
when it names the exact proposition, a location or excerpt, and a status of
`direct-support` or `qualified-support`. `background-only` and
`irrelevant-co-mention` never support a claim. A `not-located` search is reported
only as a retrieval result and cannot establish absence or a missing migration.

Heuristic outputs are inspectable suggestions: likely alias, near duplicate,
broader/narrower term, ontological category warnings, application demotion,
weaker edge, and graph-value dimensions. Each carries a reason and provenance;
there is no aggregate confidence score. Model-assisted and retrieval-dependent
judgments are preserved in separate report sections and disagreement is shown,
not averaged.

## Workflow

The dossier keeps an append-only sequence of transitions. Allowed transitions
are:

```text
harvested -> normalized -> dossier-ready -> evidence-collected -> assessed
assessed -> automated-review-passed | needs-revision | insufficient-evidence | rejected
automated-review-passed -> human-review
needs-revision -> dossier-ready
insufficient-evidence -> evidence-collected
human-review -> accepted-as-node | accepted-as-edge | accepted-as-alias
             | accepted-as-example | accepted-as-application
             | deliberate-non-edge | deferred | rejected
```

Terminal human dispositions are not produced automatically. The CLI recommends
one of `propose-node`, `propose-edge`, `add-alias`, `merge-or-refine`,
`retain-example`, `propose-application`, `weaken-edge`, `deliberate-non-edge`,
`defer`, or `reject`; a reviewer records the final state separately.

## Important failure modes

- **Vocabulary drift:** prevented by looking up atlas values in
  `graph/schema.yaml`; the dossier contract does not enumerate them.
- **False identity from fuzzy text:** semantic similarity can only create a
  review signal. Exact alias recommendations require a transparent lexical or
  explicitly supplied match.
- **Citation laundering:** citation presence, endpoint co-mention, repeated
  secondary assertions, and a syntactically valid report do not establish
  entailment.
- **Argument from failed search:** `not-located` means only that the recorded
  query did not locate a source.
- **Speculative bridge inflation:** graph metrics are read from the existing
  trusted subgraph and never include candidate edges.
- **Category inflation:** algorithms/models and one-structure applications are
  candidates for edges or canonical examples before new nodes.
- **Automation leakage:** output paths are explicit and the implementation has
  no writer for `concepts/`, `graph/`, or `paths/`.

## Human promotion

After review, translate only the approved portion of a dossier:

- node: file a node proposal or author `concepts/<slug>.md`;
- edge: use the edge proposal/composer or edit `graph/edges.yaml` and add any
  approved citation to `graph/references.bib`;
- alias: edit the matched concept's `aliases` with a schema field id;
- example: add it to the matched concept's `canonical_examples`;
- application: author an application node only when at least two existing
  structures materially converge, otherwise retain an example;
- deliberate non-edge/defer/reject: keep the dossier and decision history in
  the admission queue; do not manufacture trusted graph content.

Every promoted change is an ordinary reviewed contribution and must pass
`npm run check`. A passing candidate report is never a substitute for that
gate.

After a dossier reaches `accepted-as-node` or `accepted-as-edge`, the validator
switches from pre-admission simulation to post-admission verification. It
requires the accepted node and every accepted claim edge to exist in trusted
content with the recorded endpoints, type, strength, and context. A terminal
report therefore no longer asks for another human decision or mistakes the
successfully promoted edge for a duplicate proposal.

## Bounded campaigns

Use a declared sampling frame and a target of 100–200 raw terms for discovery,
then cap proposition-level evidence work at the strongest 30–50 dossiers.
Source overlap is desirable: it tests duplicate consolidation and keeps every
provenance rather than silently deduplicating before admission. Exhaustive
triage must account for every normalized survivor, including deferrals,
rejections, examples, applications, aliases, edges, and deliberate non-edges.
Stop after one human review round per enriched dossier.

Record duplicate/alias suggestion precision; final disposition across every
supported outcome; retrieval and entailment agreement with the reviewer;
edge-type corrections; strength reductions; review minutes; accepted claims
per review hour; rejection reasons; and hashes of two identical deterministic
runs. The pilot succeeds by producing useful accepted claims with tolerable
review effort, not by maximizing generated terms or disciplinary coverage.
