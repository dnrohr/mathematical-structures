# Contributing

The Structure Atlas is a typed knowledge graph stored as plain files:

- `concepts/<slug>.md` — one file per concept node (YAML front-matter + prose).
- `graph/edges.yaml` — every relationship claim, with type and strength.
- `graph/schema.yaml` — the controlled vocabularies. **The only place** node
  types, edge types, strengths, fields, and statuses are defined.
- `graph/symptoms.yaml` — the problem-recognition index.
- `graph/references.bib` — the literature that edges cite.

Content changes are ordinary pull requests, and **the validator is the review
gate**: `atlas-build` checks every file against the schema and fails CI with
the file and rule on any violation. You don't need to know the whole rule
table (ARCHITECTURE.md §4.2) — run the check and read what it tells you.

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
  aloud in the description: "X is a special case of Y (theorem)". The PR
  template has a checklist item for exactly this.
- **Vocabulary changes are schema changes.** Need a new field or edge type?
  Edit `graph/schema.yaml` in its own commit and let the validator show the
  blast radius.
- **Depth over breadth.** A new node earns its place by how it connects
  (spec §9): prefer enriching an existing node over adding a stub.

## Dev setup

```sh
# Node >= 20 (see .nvmrc)
npm install
npm run check   # typecheck + lint + format + tests + content validation
```

`npm run check` is the fast local loop and the first gate CI runs. The full
CI also builds the site, checks the JS budget, and runs the Playwright smoke
suite (`npm run build && npm run budget && npm run test:e2e` — Playwright
needs a browser: `npx playwright install chromium`, or point
`ATLAS_CHROMIUM` at an installed executable).

## Walkthrough: add a concept node

1. **Pick the slug** — lowercase-kebab, permanent: `concepts/<slug>.md`.
2. **Write the front-matter.** Copy the shape from any existing concept
   (e.g. [`concepts/stability-margins.md`](concepts/stability-margins.md)):

   ```yaml
   ---
   canonical_name: Gain and phase margins
   node_type: dialect # graph/schema.yaml node_types
   status: established # or analogy | hypothesis | stub
   summary: >
     One paragraph: what question does this structure answer?
   fields: [control, mechanics, biology] # schema fields
   aliases: # the dialect table — one entry per field that names it
     - name: gain margin / phase margin
       field: control
   assumptions:
     - a linear (or linearized) loop … # free text, or a slug when the
       # assumption has its own node
   canonical_examples:
     - Reading margins off a Bode or Nyquist plot
   sections: # provenance into docs/notebook-v0.md
     - notebook-v0#21-feedback-robustness-and-loop-structure
   ---
   ```

   An honest `status: stub` needs only `canonical_name`, `node_type`,
   `status`, and `summary` — stubs are legal and visibly badged in the app.
3. **Write the body.** Prose about *relationships*, not an encyclopedia
   entry. Link every mentioned concept as a `[[wiki-link]]`
   (`[[slug|display text]]` to control the text); math in `$…$` / `$$…$$`.
   Wiki-links are navigation, not claims — the validator reports
   linked-but-unedged pairs as candidate edges, which is fine.
4. **Connect it.** A node with no edges and no incoming links is flagged as
   an orphan (warn). Add at least one honest edge (next walkthrough) — an
   unconnected concept can't do the atlas's job.
5. **Run `npm run check`**, fix what it names, open the PR.

## Walkthrough: add an edge

1. Edges live in [`graph/edges.yaml`](graph/edges.yaml) — one flat,
   reviewable list, never in node front-matter. Append an entry:

   ```yaml
   - from: linear-gaussian-ssm # source slug
     to: state-space-model # target slug
     type: IS-A # schema edge_types (SCREAMING-KEBAB)
     strength: theorem # identity | theorem | special-case |
     #   strong-analogy | heuristic-analogy | speculative
     context: exact; no distributional caveats # optional
     evidence: [some-textbook-1988] # optional; keys into graph/references.bib
     notes: > # optional; keeps analogies honest
       Caveats and scope.
   ```

2. **Choose the strength honestly** — it is the epistemic core of the map.
   If the claim is an analogy, say so; `speculative` requires a gap-workflow
   `status:` and is only legal on `POSSIBLE-MISSING-MIGRATION` edges
   (which in turn may not be stronger than `heuristic-analogy`).
3. **Direction and symmetry come from the type.** `forward` phrasing reads
   `from → to` ("is a special case of"); symmetric types
   (`FIELD-DIALECT-OF`, `ANALOGOUS-TO`, …) need no reversed duplicate — the
   validator rejects one.
4. **Read the claim aloud in the PR description**, qualifiers included:
   "a linear-Gaussian SSM is a state-space model (theorem, exact)". If it
   sounds overclaimed spoken, it is overclaimed typed.
5. **Run `npm run check`**, open the PR.

Research-gap hypotheses (`POSSIBLE-MISSING-MIGRATION`) additionally follow
[docs/research-gap-workflow.md](docs/research-gap-workflow.md): start at
`status: open-candidate`, record verdicts in `notes`, and convert or retire
the edge when the literature check lands — citing what the check found as
`evidence` keys, so the trail is data rather than notes prose.

## Walkthrough: cite the literature behind a claim

1. **Add the reference** to [`graph/references.bib`](graph/references.bib) —
   a strict BibTeX subset (the file's header comment carries the house
   rules). Concrete entries only, plain UTF-8 values (write ö and – directly,
   no TeX escapes), and a lowercase-kebab author(s)-year key: two authors
   `kak-slaney-1988`, three or more `west-etal-1997`.

   ```bibtex
   @book{kak-slaney-1988,
     author    = {Kak, Avinash C. and Slaney, Malcolm},
     title     = {Principles of Computerized Tomographic Imaging},
     publisher = {IEEE Press},
     year      = {1988},
   }
   ```

   `title` and `year` are required; add a `doi` or `url` only if you have
   checked it resolves — a findable title/venue/year beats a guessed link.
2. **Cite it from the edge**: `evidence: [kak-slaney-1988]` in
   `graph/edges.yaml`. The validator closes the loop in both directions —
   an evidence key with no entry **fails the build**, and an entry cited by
   no edge is reported as an info-level curation hint.
3. **Run `npm run check`.** The app renders the rest: a compact source
   marker on the claim wherever it appears, and a Sources list on each
   concept page aggregating the works its claims cite.

Citations support a claim; they never inflate it. The edge's `strength`
stays the honest epistemic verdict — a well-cited analogy is still an
analogy.

## Proposing without a PR

Not ready to write files? Open an issue — there are templates for a
**node proposal**, an **edge proposal** (the claim, read aloud, with its
strength), and a **research-gap proposal**. A maintainer (or a later PR)
turns accepted proposals into content.

## Releases

- Every merge to `main` deploys the site to GitHub Pages (`deploy.yml`) and
  is, in that sense, a release; the site footer carries the exact commit.
- Tags mark citable milestones: `vMAJOR.MINOR.PATCH` on `main`
  (`git tag -a v1.x.y -m "…" && git push origin v1.x.y`, or run the
  **Release** workflow from the Actions tab, which creates the tag for
  credentials that can't push tags directly). Tag when the dataset or app
  reaches a state worth citing — a tag is a name for a deploy that already
  happened, not a separate pipeline.
- `graph.json` consumers version against its own `schema_version`
  (see [docs/graph-json.md](docs/graph-json.md)), which is independent of
  repository tags: the 1.x artifact shape is stable, additive changes bump
  the minor version, and breaking it is a major bump with a migration note.
