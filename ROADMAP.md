# Roadmap: The Structure Atlas

This roadmap sequences the work defined in [SPECIFICATION.md](SPECIFICATION.md) and
[ARCHITECTURE.md](ARCHITECTURE.md) into milestones with concrete tasks. Task detail
is deliberately deeper for near milestones and coarser for far ones; this file is a
living document — check items off, split tasks, and re-cut later milestones as
earlier ones teach us things. Changes to *scope* (what a milestone must prove) go
through the spec; changes to *sequencing and tasks* happen here.

**Conventions**

- Milestones are ordered by dependency, not calendar. Each has a **goal** (one
  sentence), **exit criteria** (checkable, drawn from spec §11 where possible), and
  a task list.
- `[data]` = content-layer work, `[build]` = compiler/validator, `[app]` = SPA,
  `[infra]` = CI/repo, `[curation]` = intellectual content work that needs the
  repository owner rather than a programmer.
- M1 (build core) and M2 (content extraction) intentionally overlap: the validator
  is developed against the real content as it is extracted, and the content is
  extracted against a real validator.

**Milestone map**

```
M0 foundations
 ├── M1 build pipeline core ──┐
 └── M2 content extraction ───┼── M3 reader app (first deploy)
                              │        ├── M4 graph views + symptom front door
                              │        └── M5 researcher tools (needs M1 metrics)
                              └──────────────► M6 v1 polish & launch
```

---

## M0 — Foundations

**Goal:** a repository skeleton where every later piece has an obvious home, and
the ontology has exactly one current definition.

**Exit criteria**

- [x] `npm install && npm run check` succeeds from a fresh clone (even if `check`
      does little yet).
- [x] `graph/schema.yaml` v1 exists and is the only definition of every vocabulary.
- [x] CI runs on every push/PR and is required for merge to `main` (branch
      protection enabled by the repo owner; first run green:
      [run #1](https://github.com/dnrohr/mathematical-structures/actions/runs/33809464258)).

**Tasks**

- [x] [infra] Create the directory layout from ARCHITECTURE.md §2 (`concepts/`,
      `graph/`, `paths/`, `docs/`, `build/`, `app/`); add `.gitignore` (`dist/`,
      `node_modules/`), `.editorconfig`, root `package.json` with npm workspaces
      for `build/` and `app/`.
- [x] [infra] Toolchain: TypeScript ≥ 5.5 strict, a single shared `tsconfig.base`,
      vitest, prettier + eslint with minimal rules; pin Node ≥ 20 via `engines` and
      `.nvmrc`.
- [x] [infra] `ci.yml`: install → typecheck → lint → test → `atlas-build --check`
      (stubbed until M1; the M0 stub already fully validates `schema.yaml` and the
      shape of `edges.yaml`/`symptoms.yaml`). Branch protection: owner action, see
      exit criteria.
- [x] [data] Write `graph/schema.yaml` v1 by consolidating README §1, §10, §12,
      §16, §27 into single current lists:
      - `node_types` (object, operation, model, principle, phenomenon, move,
        theorem, dialect) with display names + color-token names;
      - `edge_types` — start from §16 + §27 (IS-A, SOLVED-BY, REPRESENTED-BY,
        APPROXIMATES, LIMIT-OF, SAME-SKELETON, TRANSFORM-DUAL, GOVERNS,
        APPLIED-IN, ANALOGOUS-TO, MIGRATED-TO, POSSIBLE-MISSING-MIGRATION,
        ASSUMES, FAILS-WHEN, REPLACED-BY, LOCAL-GLOBAL-DUAL, CONTINUUM-LIMIT-OF,
        FIELD-DIALECT-OF, MEASURES-DISTANCE-TO, EXPOSES,
        SYMMETRY-SELECTS-REPRESENTATION), each with directionality and two-way
        display phrasings; cull duplicates while consolidating;
      - `strengths` (identity, theorem, special-case, strong-analogy,
        heuristic-analogy, speculative), ordered;
      - `fields` (initial ~15: control, mechanics, statistics, probability,
        quantum, pde, fluids, biology, networks, signal-processing, optimization,
        thermodynamics, information-theory, numerical-analysis, ml);
      - `statuses` for nodes (established, analogy, hypothesis, stub) and for gap
        edges (open-candidate, literature-checked, renamed-transfer,
        established-transfer, failed-transfer).
- [x] [data] Move method prose out of the README into `docs/`: working method
      (§7), research-gap workflow (§35), views catalogue (§17). Leave README
      content otherwise untouched until M2.
- [x] [infra] Add `CONTRIBUTING.md` stub: how content PRs work, "the validator is
      the review gate", slug rules.

---

## M1 — Build pipeline core

**Goal:** `atlas-build` turns the content tree into validated, deterministic
`graph.json` + `search-index.json`, and CI rejects malformed content.

**Exit criteria**

- [ ] A PR adding an edge with an unknown type/endpoint fails CI with a message
      naming the file and the rule (spec §11).
- [ ] Build twice → byte-identical artifacts.
- [ ] `graph.json` documented well enough that an outsider could consume it
      (`docs/graph-json.md`).

**Tasks**

- [ ] [build] Stage 1 parse: front-matter + Markdown reader for `concepts/*.md`;
      YAML readers for `edges.yaml`, `symptoms.yaml`, `schema.yaml`; batch error
      collection (never die on first error); shared typed model in
      `build/src/model.ts` (imported later by the app).
- [ ] [build] Stage 2 validate: implement the ARCHITECTURE.md §4.2 rule table —
      each rule its own function with a rule ID, severity, file/line pointer, and
      a failing fixture test. Include the epistemic rules (speculative ⇒ workflow
      status; POSSIBLE-MISSING-MIGRATION ⇒ ≤ heuristic-analogy).
- [ ] [build] Stage 3 link: `[[wiki-link]]` resolution (with `|display` form),
      backlink harvesting, candidate-edge detection (linked-but-unedged, info
      level), edge grouping per node by type/direction using schema phrasings.
- [ ] [build] Stage 3 render: Markdown → sanitized HTML (marked or markdown-it +
      a strict sanitizer); KaTeX server-side rendering for `$…$` / `$$…$$`; TeX
      errors are validation errors.
- [ ] [build] Stage 5 emit: `graph.json` (`schema_version` 1.0.0,
      `generated_from` git SHA, sorted keys, no timestamps); MiniSearch index
      build with alias-weighted fields; `--check` mode (stages 1–2 only);
      `--out DIR`; exit codes suitable for CI.
- [ ] [build] Determinism test (double-build byte equality) and fixture content
      trees: one minimal-valid, one exercising every validation rule.
- [ ] [infra] Wire real `atlas-build --check` into `ci.yml`.
- [ ] [build] `docs/graph-json.md`: the public shape, versioning policy
      (semver; additive = minor), and a consumption example (a few lines of
      Python/notebook code).

*Deferred from M1 on purpose:* stage 4 metrics (M5) — the reader app doesn't need
them, and shipping the reader earlier beats shipping analytics earlier.

---

## M2 — Content extraction (runs alongside M1)

**Goal:** the README's intellectual content lives in the content layer with no
information loss, and the typed graph exists as data for the first time.

**Exit criteria**

- [ ] ~25–30 concept files, every one passing validation at `established` or
      honestly marked `stub`/`hypothesis`.
- [ ] ≥ 80 typed edges including every §34 translation chain and every §15/§29+
      gap candidate, each with strength and (for gaps) workflow status.
- [ ] The distinctions the README is most careful about survive as data: Kalman
      filter vs. HMM nomenclature (§8/§13), entropy false friends (§31),
      renormalization ≠ dimensional analysis (§14) — spot-checked by reading the
      generated `graph.json`.
- [ ] `README.md` reduced to purpose + navigation + pointers; the old notebook
      preserved intact at `docs/notebook-v0.md` for provenance.

**Tasks**

- [ ] [curation] Node inventory pass: walk README §2 candidate list + §26 hubs;
      fix the v1 node set (~25–30) and slugs; record in a tracking issue. Bias:
      depth over breadth (spec §9) — prefer fewer, richer nodes.
- [ ] [curation] Extract the five richest write-ups first — eigenvalues (§12),
      probability/Bayes/Markov (§13), dimensional analysis (§11+§14 merged),
      integral transforms (§19), feedback (§21) — as the template-setting
      examples; merge the README's duplicate sections during extraction.
- [ ] [curation] Extract remaining nodes: series/approximation (§3), vector
      calculus/conservation (§20), phase space/bifurcation/chaos (§22), large
      numbers (§23), continuity/smoothness (§24), symmetry/Noether (§29),
      optimization/variational (§30), entropy cluster (§31 — likely several
      nodes), complex analysis (§32), plus the reusable moves (§12-moves) as
      `node_type: move` nodes.
- [ ] [curation] Edge pass: encode §5 cross-links, §8 nomenclature table, §9
      migrations, §34 translation chains, and dialect aliases into `edges.yaml` /
      front-matter `aliases`, assigning honest strengths. This is the highest-
      judgment task in the roadmap; expect it to force schema.yaml refinements.
- [ ] [curation] Gap pass: §15 + scattered candidates → POSSIBLE-MISSING-MIGRATION
      edges, all `open-candidate`, with the §35 workflow notes.
- [ ] [data] `symptoms.yaml` from the §25 table (10 symptoms), each move
      validated against real slugs.
- [ ] [data] Slim the README; move the notebook to `docs/notebook-v0.md`; each
      concept file's `sections:` field points back into it.
- [ ] [curation] Peer-review the edge set as a set (one PR review pass over
      `edges.yaml` reading every claim aloud — the format exists precisely to
      allow this).

---

## M3 — Reader app (first deploy)

**Goal:** the Explorer's app exists: searchable concept pages with dialect tables
and typed edge sentences, deployed on GitHub Pages.

**Exit criteria**

- [ ] Live Pages URL; page loads and first navigation feel instant.
- [ ] Explorer journey passes: "eigenvalues" → dialect table visible → "spectral
      gap governs mixing time in Markov chains" in ≤ 3 clicks (spec §11).
- [ ] Every concept mentioned in prose is a working link; light and dark themes
      both fully legible, math included.

**Tasks**

- [ ] [app] Scaffold Vite + vanilla TS app; hash router; typed `data/` loader
      validating `schema_version`; graceful "data too new/old" screen.
- [ ] [app] `style/` semantic style module: CSS custom properties for node-type
      hues and strength line grammar keyed to schema.yaml tokens; light/dark
      themes honoring `prefers-color-scheme` with manual override; compile-time
      check that every schema token has a style token.
- [ ] [app] Concept view per spec §3.1 (minus ego-network, M4): header + type
      badge, summary, dialect table, assumptions with FAILS-WHEN/REPLACED-BY
      surfaced adjacent, edge sentences grouped by type with strength badges,
      examples, provenance link, backlinks ("mentioned by").
- [ ] [app] Shared fragments: edge-sentence renderer, strength badge, dialect
      table (reused by M4/M5 views).
- [ ] [app] Search: MiniSearch over prebuilt index; `/` focuses; alias hits
      show "aka 'poles' in control →" framing; simple A–Z index page as fallback.
- [ ] [app] Landing v1: search + node-type index + symptom list as plain links
      (interactive symptom routing is M4).
- [ ] [app] Moves index page (`#/moves`) — cheap now, high spec priority (§5.2).
- [ ] [infra] `deploy.yml`: build → Pages on push to `main`; footer shows
      `generated_from` SHA.
- [ ] [app] Playwright smoke test for the Explorer journey, run in CI against
      built `dist/`.

---

## M4 — Graph views and the symptom front door

**Goal:** the Problem-Solver's entry path and the graph-as-lens views exist.

**Exit criteria**

- [ ] Symptom journey passes: "too many dimensional parameters" → Buckingham Π
      with Reynolds example in ≤ 3 clicks (spec §11).
- [ ] Ego-network on every concept page, legible in both themes, never rendering
      the full graph; every graph-visible relationship also present as text.
- [ ] Any lens/path view state is shareable by URL.

**Tasks**

- [ ] [app] `graph-render/`: one d3-force SVG component; props = pre-filtered
      nodes/edges + preset (ego | lens | path); node color by type token, edge
      line style by strength token; click → navigate, hover → edge sentence;
      keyboard focusable; no zoom/pan gymnastics in v1 — legibility by curation
      of what's rendered, not by camera controls.
- [ ] [app] Ego-network on concept pages: 1 hop default, "expand to 2 hops"
      control, cap rendered nodes (~25) with an overflow "and N more" list.
- [ ] [app] Landing v2: "What does your problem look like?" — symptom cards →
      symptom detail (ranked moves with one-line whys, mature fields, worked
      example link).
- [ ] [app] Dialect lookup (`#/dialects`): search any alias → canonical node +
      full dialect table; the reverse-translation framing ("'perfect adaptation'
      is integral feedback in control language").
- [ ] [app] Lens view (`#/lens`): filters for edge type / node type / field /
      minimum strength; filter state entirely in URL; empty-state guidance.
- [ ] [app] Path view (`#/path/a/b`): bounded-depth BFS in `data/` over
      strength-filtered edges; render chains as edge-sentence sequences plus the
      graph preset; this supersedes the hand-written §34 chains (verify each §34
      chain is findable — good integration test).
- [ ] [app] Playwright: symptom journey + one lens/path URL-state round-trip.

---

## M5 — Researcher tools

**Goal:** the analytical layer: build-time metrics, the metrics and open-questions
views, and data export.

**Exit criteria**

- [ ] All speculative edges listable with workflow status in one view; dataset
      exportable in one action (spec §11).
- [ ] Metrics visibly computed on the trusted-strength subgraph only, and said so
      in the UI.
- [ ] First curation yield: at least one gap candidate moved through the §35
      workflow using the tool itself.

**Tasks**

- [ ] [build] Stage 4 analyze: degree; Brandes betweenness; Louvain/Leiden
      communities; span entropy; dialect count — computed over
      `strength ≥ special-case`; unit-tested on hand-checkable fixture graphs
      (path, star, bridged cliques).
- [ ] [build] Candidate-edge + gap summaries packaged into `graph.json.metrics`.
- [ ] [app] Metrics view (`#/metrics`): sortable rankings (hubs, bridges, span,
      dialect count); community coloring toggle in lens view ("does the graph
      rediscover the disciplines?"); load `dataviz` conventions for any charting.
- [ ] [app] Open questions view (`#/questions`): gap edges grouped by workflow
      status, each with its notes and the §35 checklist rendered; "how to
      investigate" links to `docs/research-gap-workflow.md`.
- [ ] [build] Export emitters: GraphML + edges/nodes CSV alongside `graph.json`;
      app "Download dataset" links.
- [ ] [curation] Dogfood pass: pick one open candidate (e.g. stability margins →
      biological regulation), run the workflow, record the outcome as data —
      proving the loop closes.

---

## M6 — v1 polish and launch

**Goal:** the spec's §11 criteria all pass, and the project presents itself well
enough to invite contributors.

**Exit criteria**

- [ ] Every spec §11 success criterion checked off against the live site.
- [ ] JS budget ≤ 200 KB gzipped (excluding data); Lighthouse a11y ≥ 95 both
      themes; keyboard-only walkthrough of all three persona journeys.
- [ ] Tagged `v1.0.0`; `graph.json` schema declared stable at 1.x.

**Tasks**

- [ ] [app] Accessibility pass: focus order, aria labels on badges/graph, strength
      never color-only (audit), reduced-motion respect.
- [ ] [app] Keyboard polish: `/` search, arrow-hop along a page's edge list,
      documented shortcuts panel (`?`).
- [ ] [app] Performance pass against budgets; decide (measure first) whether the
      per-node JSON split from ARCHITECTURE.md §4.5 is needed — expected: no.
- [ ] [infra] Finish `CONTRIBUTING.md` (content-PR walkthrough: add a node, add
      an edge, run `--check` locally); PR template with a "new edges reviewed as
      claims" checklist item; issue templates for node/edge/gap proposals.
- [ ] [data] README final form: what this is, live-site link, how to read the
      graph legend, how to contribute.
- [ ] [curation] Content QA sweep: every `stub` either promoted or visibly
      badged; every warn-level validator finding triaged.
- [ ] [infra] Tag `v1.0.0`; enable a documented release flow (tag → Pages deploy
      already implied by `main`).

---

## Post-v1 direction (unordered backlog; spec §8 owns the rationale)

- Propose-an-edge static form → prefilled GitHub issue/PR (§8.1).
- `references.bib` + citation rendering; evidence keys start being filled (§8.2).
- Learning paths: `paths/*.yaml` content type + guided-walk UI (§8.3).
- LLM-assisted authoring experiments — drafting node files in house style,
  free-text symptom matching, dialect-aware gap literature search — always landing
  as ordinary validated PRs (§8.4).
- `atlas-build --content DIR` hardening for forked atlases (§8.5).
- Scale work (per-node JSON, pagination) when node count approaches ~100 (§8.6).
- Additional export formats on demand (§8.7).
- Content expansion beyond v1 set, guided by the metrics view: fill structural
  holes (low-span hubs, missing dialect rows) rather than chasing coverage.

## Risks worth naming now

| Risk | Mitigation baked into the plan |
| --- | --- |
| Edge curation quality drifts (analogies overclaimed) | strengths are schema-enforced; epistemic validator rules; M2's read-every-claim review; M5 dogfood pass |
| Content extraction stalls (it's the real work) | M2 runs beside M1; template-setting five nodes first; stubs are legal and visible |
| Graph views balloon in scope | one shared renderer, three presets, "no full graph" rule, no camera controls in v1 |
| Solo-maintainer bus factor | everything is plain files + one boring build; CONTRIBUTING and validator make drive-by PRs safe |
| Schema churn after content exists | schema.yaml changes are one-file diffs, and the validator instantly reports every file the change breaks |
