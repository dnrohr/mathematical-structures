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

- [x] A PR adding an edge with an unknown type/endpoint fails CI with a message
      naming the file and the rule (spec §11) — covered by the
      `edge/unknown-endpoint` pipeline test; CI runs the same `--check`.
- [x] Build twice → byte-identical artifacts (unit test + verified on the repo
      tree).
- [x] `graph.json` documented well enough that an outsider could consume it
      (`docs/graph-json.md`).

**Tasks**

- [x] [build] Stage 1 parse: front-matter + Markdown reader for `concepts/*.md`;
      YAML readers for `edges.yaml`, `symptoms.yaml`, `schema.yaml`; batch error
      collection (never die on first error); shared typed model in
      `build/src/model.ts` (imported later by the app).
- [x] [build] Stage 2 validate: implement the ARCHITECTURE.md §4.2 rule table —
      each rule its own function with a rule ID, severity, file/line pointer, and
      a failing fixture test. Include the epistemic rules (speculative ⇒ workflow
      status; POSSIBLE-MISSING-MIGRATION ⇒ ≤ heuristic-analogy).
- [x] [build] Stage 3 link: `[[wiki-link]]` resolution (with `|display` form),
      backlink harvesting, candidate-edge detection (linked-but-unedged, info
      level), edge grouping per node by type/direction using schema phrasings.
- [x] [build] Stage 3 render: Markdown → safe HTML (marked with raw HTML escaped
      by construction and dangerous link schemes neutralized — stricter than
      after-the-fact sanitization); KaTeX server-side rendering for `$…$` /
      `$$…$$`; TeX errors are validation errors.
- [x] [build] Stage 5 emit: `graph.json` (`schema_version` 1.0.0,
      `generated_from` git SHA, sorted keys, no timestamps); MiniSearch index
      build with alias-weighted fields; `--check` mode (validation only, no
      files written — includes link/render rules); `--out DIR`; exit codes
      suitable for CI.
- [x] [build] Determinism test (double-build byte equality) and fixture content
      tree (minimal-valid), plus per-rule programmatic cases — every validation
      rule has a triggering test (51 tests).
- [x] [infra] Wire real `atlas-build --check` into `ci.yml` (`npm run check`
      already invokes it; it now runs the full validation pipeline).
- [x] [build] `docs/graph-json.md`: the public shape, versioning policy
      (semver; additive = minor), and a consumption example (a few lines of
      Python/notebook code).

*Deferred from M1 on purpose:* stage 4 metrics (M5) — the reader app doesn't need
them, and shipping the reader earlier beats shipping analytics earlier.

---

## M2 — Content extraction (runs alongside M1)

**Goal:** the README's intellectual content lives in the content layer with no
information loss, and the typed graph exists as data for the first time.

**Exit criteria**

- [x] ~25–30 concept files, every one passing validation at `established` or
      honestly marked `stub`/`hypothesis` — landed at 38 files, all
      `established`; the overage is forced by the spot-checks below needing
      standalone endpoints (inventory and merge decisions recorded in
      [#3](https://github.com/dnrohr/mathematical-structures/issues/3)).
- [x] ≥ 80 typed edges including every §34 translation chain and every §15/§29+
      gap candidate, each with strength and (for gaps) workflow status —
      84 edges; chain 2 (impulse response ↔ Green's function ↔ propagator) is
      one object and is realized as dialect aliases on `greens-function`.
- [x] The distinctions the README is most careful about survive as data: Kalman
      filter vs. HMM nomenclature (§8/§13), entropy false friends (§31),
      renormalization ≠ dimensional analysis (§14) — spot-checked by reading the
      generated `graph.json` (lgssm IS-A ssm/hmm + SOLVED-BY kalman with no
      kalman↔hmm containment; entropy edges strong-analogy with caveat notes;
      dimensional-analysis ↔ renormalization at heuristic-analogy).
- [x] `README.md` reduced to purpose + navigation + pointers; the old notebook
      preserved intact at `docs/notebook-v0.md` for provenance.

**Tasks**

- [x] [curation] Node inventory pass: walk README §2 candidate list + §26 hubs;
      fix the v1 node set (~25–30) and slugs; record in a tracking issue
      ([#3](https://github.com/dnrohr/mathematical-structures/issues/3)). Bias:
      depth over breadth (spec §9) — prefer fewer, richer nodes.
- [x] [curation] Extract the five richest write-ups first — eigenvalues (§12),
      probability/Bayes/Markov (§13), dimensional analysis (§11+§14 merged),
      integral transforms (§19), feedback (§21) — as the template-setting
      examples; merge the README's duplicate sections during extraction.
- [x] [curation] Extract remaining nodes: series/approximation (§3), vector
      calculus/conservation (§20), phase space/bifurcation/chaos (§22), large
      numbers (§23), continuity/smoothness (§24), symmetry/Noether (§29),
      optimization/variational (§30), entropy cluster (§31 — Shannon and
      thermodynamic nodes, with KL/cross-entropy/K–S as dialects and edges),
      complex analysis (§32), plus the reusable moves (§12-moves) as
      `node_type: move` nodes (linearization, nondimensionalization,
      change-of-representation; the remaining §12 moves live on the
      change-of-representation page until they earn nodes).
- [x] [curation] Edge pass: encode §5 cross-links, §8 nomenclature table, §9
      migrations, §34 translation chains, and dialect aliases into `edges.yaml` /
      front-matter `aliases` (117 aliases across all 38 nodes), assigning honest
      strengths. No schema.yaml changes turned out to be needed.
- [x] [curation] Gap pass: §15 + scattered candidates → POSSIBLE-MISSING-MIGRATION
      edges (5 edges covering all six §15 bullets; two loop-design candidates
      share the feedback-control → biological-regulation pair), all
      `open-candidate`, with the §35 workflow notes.
- [x] [data] `symptoms.yaml` from the §25 table (10 symptoms), each move
      validated against real slugs.
- [x] [data] Slim the README; move the notebook to `docs/notebook-v0.md`; each
      concept file's `sections:` field points back into it.
- [ ] [curation] Peer-review the edge set as a set (one PR review pass over
      `edges.yaml` reading every claim aloud — the format exists precisely to
      allow this). Owner review; tracked in
      [#3](https://github.com/dnrohr/mathematical-structures/issues/3).

---

## M3 — Reader app (first deploy)

**Goal:** the Explorer's app exists: searchable concept pages with dialect tables
and typed edge sentences, deployed on GitHub Pages.

**Exit criteria**

- [x] Live Pages URL; page loads and first navigation feel instant —
      <https://dnrohr.github.io/mathematical-structures/>. The first deploy
      needed the one-time owner toggle (Settings → Pages → Source: GitHub
      Actions; the workflow token cannot enable Pages itself); every later
      push to `main` deploys automatically.
- [x] Explorer journey passes: "eigenvalues" → dialect table visible → "spectral
      gap governs mixing time in Markov chains" in ≤ 3 clicks (spec §11) —
      proven by the Playwright smoke suite in CI (search → concept → GOVERNS
      edge: 2 clicks, dialect table asserted on the way).
- [x] Every concept mentioned in prose is a working link (validator rule
      `link/unknown-target` + smoke test); light and dark themes both fully
      legible, math included (smoke suite exercises the toggle, persistence,
      and KaTeX in dark).

**Tasks**

- [x] [app] Scaffold Vite + vanilla TS app; hash router; typed `data/` loader
      validating `schema_version`; graceful "data too new/old" screen.
- [x] [app] `style/` semantic style module: CSS custom properties for node-type
      hues and strength line grammar keyed to schema.yaml tokens; light/dark
      themes honoring `prefers-color-scheme` with manual override; the
      schema↔style token check runs as a unit test inside `npm run check`
      (`app/test/style-tokens.test.ts`), so an unstyled schema token still
      fails the gate.
- [x] [app] Concept view per spec §3.1 (minus ego-network, M4): header + type
      badge, summary, dialect table, assumptions with FAILS-WHEN/REPLACED-BY
      surfaced adjacent, edge sentences grouped by type with strength badges,
      examples, provenance link, backlinks ("mentioned by").
- [x] [app] Shared fragments: edge-sentence renderer, strength badge, dialect
      table (reused by M4/M5 views) — `app/src/views/common/`.
- [x] [app] Search: MiniSearch over prebuilt index; `/` focuses; alias hits
      show "aka 'poles' in control →" framing; simple A–Z index page as
      fallback (`#/index`).
- [x] [app] Landing v1: search + node-type index + symptom list as plain links
      (interactive symptom routing is M4).
- [x] [app] Moves index page (`#/moves`) — cheap now, high spec priority (§5.2).
- [x] [infra] `deploy.yml`: build → Pages on push to `main`; footer shows
      `generated_from` SHA.
- [x] [app] Playwright smoke test for the Explorer journey, run in CI against
      built `dist/` (nine tests: journey, reverse-dialect framing, prose
      links, symptom links, moves, themes, `/` hotkey, 404 route, provenance
      footer).

---

## M4 — Graph views and the symptom front door

**Goal:** the Problem-Solver's entry path and the graph-as-lens views exist.

**Exit criteria**

- [x] Symptom journey passes: "too many dimensional parameters" → Buckingham Π
      with Reynolds example in ≤ 3 clicks (spec §11) — proven by the Playwright
      suite: landing card → symptom detail → dimensional-analysis is 2 clicks,
      with Buckingham Π and the Reynolds example asserted on the target page.
- [x] Ego-network on every concept page, legible in both themes, never rendering
      the full graph; every graph-visible relationship also present as text —
      edges touching the node are the page's Connections/Assumptions sections;
      edges between neighbors get their own claim list under the graph; an
      integration test asserts a non-empty ego for all 38 concepts, and the
      smoke suite covers both themes and the node cap.
- [x] Any lens/path view state is shareable by URL — filters and endpoints live
      entirely in the URL; round-trips (URL → view and view → URL → reload)
      are smoke-tested for both views.

**Tasks**

- [x] [app] `graph-render/`: one d3-force SVG component; props = pre-filtered
      nodes/edges + preset (ego | lens | path); node color by type token, edge
      line style by strength token; click → navigate, hover → edge sentence;
      keyboard focusable; no zoom/pan gymnastics in v1 — legibility by curation
      of what's rendered, not by camera controls. Layout runs synchronously
      before paint (deterministic d3-force defaults, fit-to-canvas), so nothing
      animates or moves under keyboard focus; edges are focusable and read
      their sentence into a live caption; gap edges render in the warn style.
- [x] [app] Ego-network on concept pages: 1 hop default, "expand to 2 hops"
      control, cap rendered nodes (~25) with an overflow "and N more" list.
      A sticky side panel on wide screens, a normal section on small ones.
- [x] [app] Landing v2: "What does your problem look like?" — symptom cards →
      symptom detail (`#/s/<id>`: ranked moves with one-line whys, mature
      fields, worked example link); the cards keep their inline move links as
      the 1-click shortcut, and search symptom hits open the detail page.
- [x] [app] Dialect lookup (`#/dialects`): search any alias → canonical node +
      full dialect table; the reverse-translation framing ("'perfect adaptation'
      is what Systems & mathematical biology calls Feedback and loop
      structure"). Exact-substring matching on purpose: a fuzzy hit would be a
      wrong translation.
- [x] [app] Lens view (`#/lens`): filters for edge type / node type / field /
      minimum strength; filter state entirely in URL; empty-state guidance.
      A lens wider than ~32 nodes falls back to the always-complete claim list
      (the "no full-graph render" rule); node filters keep edges touching at
      least one matching concept.
- [x] [app] Path view (`#/path/a/b`): bounded-depth BFS in `data/` over
      strength-filtered edges; render chains as edge-sentence sequences plus the
      graph preset; this supersedes the hand-written §34 chains — every §34
      chain is verified findable by `app/test/chains.test.ts`, which runs the
      build pipeline in-process over the real content tree (chain 2 is dialect
      aliases on `greens-function`, asserted via the dialect lookup). The
      default strength floor excludes speculative gap edges so a hypothesis is
      never presented as a connection; loosening it is an explicit opt-in.
- [x] [app] Playwright: symptom journey + one lens/path URL-state round-trip —
      nine new smoke tests (journey, ego render/expand/cap, graph↔text parity,
      themes, lens round-trip + empty state, path round-trip + swap, dialect
      lookup, symptom search routing).

---

## M5 — Researcher tools

**Goal:** the analytical layer: build-time metrics, the metrics and open-questions
views, and data export.

**Exit criteria**

- [x] All speculative edges listable with workflow status in one view; dataset
      exportable in one action (spec §11) — `#/questions` groups every gap edge
      by §35 status (smoke-tested against the emitted edge list), and both
      researcher views carry one-click "Download the dataset" links
      (graph.json, GraphML, CSVs).
- [x] Metrics visibly computed on the trusted-strength subgraph only, and said so
      in the UI — stage 4 runs on `strength ≥ special-case` (decision log #7);
      the metrics view leads with that statement and the counts (60 of 84
      edges today), and a unit test proves a speculative edge buys no degree,
      centrality, or community membership.
- [x] First curation yield: at least one gap candidate moved through the §35
      workflow using the tool itself — stability margins → biological
      regulation, picked from `#/questions`, resolved as an established
      transfer (control-theoretic systems biology) and converted to
      MIGRATED-TO with the verdict trail in the edge notes.

**Tasks**

- [x] [build] Stage 4 analyze: degree; Brandes betweenness; Louvain
      communities; span entropy; dialect count — computed over
      `strength ≥ special-case`; unit-tested on hand-checkable fixture graphs
      (path, star, bridged cliques — exact normalized betweenness values, the
      cliques rediscovered as communities).
- [x] [build] Candidate-edge + gap summaries packaged into `graph.json.metrics`
      — graph.json is now 1.1.0 (additive minor), documented in
      `docs/graph-json.md`.
- [x] [app] Metrics view (`#/metrics`): sortable rankings (hubs, bridges, span,
      dialect count) with sort state in the URL; community coloring toggle in
      lens view (`communities=1` — "does the graph rediscover the
      disciplines?" gets a legible yes: the five clusters track estimation,
      stability, scaling, transforms, and mechanics); `dataviz` conventions
      applied (CVD-validated fixed-order community palette per theme, labeled
      chips so identity is never color-alone, meters only reinforce printed
      values).
- [x] [app] Open questions view (`#/questions`): gap edges grouped by workflow
      status, each with its notes and the §35 checklist rendered; "how to
      investigate" links to `docs/research-gap-workflow.md`; the candidate-edge
      queue (wiki-linked, unedged pairs) rendered from the metrics block.
- [x] [build] Export emitters: GraphML + edges/nodes CSV alongside `graph.json`
      (deterministic, byte-identical across builds); app "Download dataset"
      links.
- [x] [curation] Dogfood pass: pick one open candidate (e.g. stability margins →
      biological regulation), run the workflow, record the outcome as data —
      proving the loop closes. Done for exactly that candidate; the §35 trail
      (verdict, scope caveat, literature pointers) lives in the converted
      edge's notes for owner review.

---

## M6 — v1 polish and launch

**Goal:** the spec's §11 criteria all pass, and the project presents itself well
enough to invite contributors.

**Exit criteria**

- [ ] Every spec §11 success criterion checked off against the live site —
      each criterion has a Playwright test that CI runs against the built
      site on every push (journeys: `explorer-journey`/`m4-views` specs;
      researcher one-view + one-action export: `m5-views`; malformed-edge
      rejection: the `edge/unknown-endpoint` pipeline test behind
      `npm run check`; no-information-loss: the M2 spot-checks). Flipped
      once the deployed site is verified serving the release commit
      (footer `generated_from` + journey spot-checks), as M3 did in #7.
- [x] JS budget ≤ 200 KB gzipped (excluding data): 28.4 KB — measured and
      now *enforced* by `npm run budget` in CI. Lighthouse accessibility
      **100** in both themes (light default; dark via the site's
      `data-theme` palette), with the equivalent axe-core WCAG 2.1 A/AA
      scans of all nine view kinds × both themes running in CI as the
      standing guard. Keyboard-only walkthroughs of all three persona
      journeys are Playwright tests (`m6-a11y.spec.ts`).
- [ ] Tagged `v1.0.0`; `graph.json` declared stable at 1.x in
      `docs/graph-json.md` (done). The tag lands on this milestone's
      squash-merge commit; flipped with the live-site check above.

**Tasks**

- [x] [app] Accessibility pass: focus moves to the new view on navigation
      (skip-link target reused); aria labels on the search listbox added to
      the existing combobox/graph labeling; color-only audit fixed the real
      finds — `ink-faint` text raised to ≥ 4.5:1 on every surface in both
      palettes, community/type chips now carry ink text with the hue in
      dot + border + tint, and the auto-dark (`prefers-color-scheme`) block
      was missing all eight community-token remaps (the style-token gate
      test now checks them). Motion audit: the only motion is opt-in smooth
      scrolling already gated behind `prefers-reduced-motion`.
- [x] [app] Keyboard polish: `/` search (M3) + ↑/↓ arrow-hop along any
      page's claim list (roving focus, never steals scrolling) + a `?`
      shortcuts panel (native `<dialog>`, also reachable from the footer).
- [x] [app] Performance pass: 28.4 KB gzipped JS against the 200 KB budget
      (14%), enforced in CI; graph.json is 375 KB raw / 73 KB gzipped at 38
      nodes — the §4.5 per-node split is **not needed** (as expected; the
      loader interface keeps the escape hatch open).
- [x] [infra] `CONTRIBUTING.md` finished (add-a-node and add-an-edge
      walkthroughs, local `--check` loop, release flow); PR template with
      the "new edges reviewed as claims" checklist; issue forms for
      node/edge/gap proposals.
- [x] [data] README final form: what it is, live-site link, "how to read
      the map" legend, how to contribute, dataset stability.
- [x] [curation] Content QA sweep: 38/38 nodes `established` — no stubs to
      promote (non-established statuses stay visibly badged by the app);
      validator reports **0 warnings**; the 53 info-level candidate edges
      are the curation queue by design, rendered in `#/questions`.
- [ ] [infra] Tag `v1.0.0` on the milestone's merge commit (flipped with
      the exit criteria above); release flow documented in CONTRIBUTING.md
      (every merge to `main` deploys; annotated tags name citable
      milestones; artifact versioning is `graph.json`'s own semver).

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
