# Contributing

(Stub — expanded in M6; see ROADMAP.md.)

The Structure Atlas is a typed knowledge graph stored as plain files:

- `concepts/<slug>.md` — one file per concept node (YAML front-matter + prose).
- `graph/edges.yaml` — every relationship claim, with type and strength.
- `graph/schema.yaml` — the controlled vocabularies. **The only place** node
  types, edge types, strengths, fields, and statuses are defined.
- `graph/symptoms.yaml` — the problem-recognition index.

## Ground rules

- **The validator is the review gate.** Run `npm run check` before pushing;
  CI runs the same thing on every PR and fails on any content error.
- **Slugs are permanent.** Lowercase-kebab (`state-space-model`), chosen once,
  never renamed casually — every edge, link, and URL keys off them.
- **Every edge carries its strength honestly.** `identity`/`theorem` claims
  need to be defensible as mathematics; analogies say they are analogies;
  `POSSIBLE-MISSING-MIGRATION` edges are hypotheses and must carry a workflow
  status (see `docs/research-gap-workflow.md`).
- **Edges are reviewed as claims.** A PR adding edges should read each one
  aloud in the description: "X is a special case of Y (theorem)".
- **Vocabulary changes are schema changes.** Need a new field or edge type?
  Edit `graph/schema.yaml` in its own commit and let the validator show the
  blast radius.

## Dev setup

```sh
# Node >= 20 (see .nvmrc)
npm install
npm run check   # typecheck + lint + format + tests + content validation
```
