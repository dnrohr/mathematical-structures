# Roadmap: The Structure Atlas

This roadmap sequences the work defined in [SPECIFICATION.md](SPECIFICATION.md),
[ARCHITECTURE.md](ARCHITECTURE.md), and — for M11 onward —
[UI_REDESIGN.md](UI_REDESIGN.md) into milestones with concrete tasks. Task detail
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

M6 (v1 shipped)
 └── M7 applications: the third front door
      ├── M8 evidence & citations    (M7 creates the citation pressure)
      ├── M9 learning paths          (M7 provides the spines)
      └── M10 propose-an-edge form   (M7 proves the contribution pattern)

M10 (v1 program complete; UI_REDESIGN.md specifies what follows)
 └── M11 work queue: selection without arbitrariness
      ├── M12 survey views           (matrix + map; renders M11's holes)
      └── M13 applications wave, batch 1 + practitioner UI
               └── M14 pairs & orientation  (compare, atlas, facets — sequence, not dependency)
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

- [x] Every spec §11 success criterion checked off against the live site —
      each criterion has a Playwright test that CI runs against the built
      site on every push (journeys: `explorer-journey`/`m4-views` specs;
      researcher one-view + one-action export: `m5-views`; malformed-edge
      rejection: the `edge/unknown-endpoint` pipeline test behind
      `npm run check`; no-information-loss: the M2 spot-checks). Live-site
      verification: [deploy run #6](https://github.com/dnrohr/mathematical-structures/actions/runs/33922712335)
      published the release commit `81a7887` green, and its tree is
      byte-identical to the CI-validated tree the full suite (47 tests)
      passed on — the deployed artifact is the tested artifact.
- [x] JS budget ≤ 200 KB gzipped (excluding data): 28.4 KB — measured and
      now *enforced* by `npm run budget` in CI. Lighthouse accessibility
      **100** in both themes (light default; dark via the site's
      `data-theme` palette), with the equivalent axe-core WCAG 2.1 A/AA
      scans of all nine view kinds × both themes running in CI as the
      standing guard. Keyboard-only walkthroughs of all three persona
      journeys are Playwright tests (`m6-a11y.spec.ts`).
- [x] Tagged `v1.0.0` on the milestone's squash-merge commit (`81a7887`),
      cut by the Release workflow (#11); `graph.json` declared stable at
      1.x in `docs/graph-json.md`.

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
- [x] [infra] `v1.0.0` tagged on `81a7887` via the Release workflow
      (added in #11 when direct tag pushes turned out to need it); release
      flow documented in CONTRIBUTING.md (every merge to `main` deploys;
      annotated tags name citable milestones — `git push origin vX.Y.Z` or
      the Actions **Release** workflow; artifact versioning is
      `graph.json`'s own semver).

---

## M7 — Applications: the third front door

**Goal:** the dormant `application` node type earns its keep — a curated batch of
domain problems, each showing several structures converging on one real system,
discoverable from the landing page.

**Exit criteria**

- [x] 4–6 new `application` nodes, every one `established` and connected to ≥ 2
      distinct structure nodes by APPLIED-IN edges with honest strengths and
      per-edge context (spec §8.8's bar; `biological-regulation` — v1's only
      application node — is the template) — landed at 4
      (`computational-imaging`, `pagerank`, `vascular-branching`,
      `resource-allocation`; 12 APPLIED-IN edges), batch and strengths fixed in
      [#14](https://github.com/dnrohr/mathematical-structures/issues/14)
      before writing.
- [x] Application journey passes: search a domain name ("PageRank") → the
      application page with its structure sentences → a connected structure page
      ("eigenvalues") in ≤ 2 clicks, proven by a Playwright test like the M3/M4
      journeys — `m7-applications.spec.ts`, click 1 search hit → `#/c/pagerank`,
      click 2 "Makes use of" sentence → `#/c/eigenvalues`.
- [x] The ≥ 2-structures bar is a validator rule, not a convention: an
      `application` node with fewer than two distinct structure neighbors over
      APPLIED-IN / MIGRATED-TO edges warns (`biological-regulation` passes via
      its three MIGRATED-TO edges, so the 0-warning state holds) —
      `application/underconnected`, with programmatic failing fixtures per
      §4.2 practice; the full tree still validates at 0 warnings.

**Tasks**

- [x] [curation] Application inventory pass (mirrors M2's): fix the batch and
      slugs in a tracking issue before writing. Starting candidates, each
      already hooked into the graph: SAR / computational imaging
      (fourier-analysis, radon-transform, greens-function, complex-analysis —
      the Fourier slice theorem is already radon-transform's centerpiece);
      PageRank / search ranking (markov-chains, whose "random surfer / PageRank
      dynamics" alias exists, eigenvalues, graph-laplacian); vascular branching
      / allometry (dimensional-analysis via its "allometric scaling arguments"
      alias, variational-principles via Murray's law, plus the open allometry
      gap edge); profit maximization / resource allocation (optimization,
      duality; the economics field id exists). Rejected candidates demote to
      `canonical_examples` on the structure pages — the tomography precedent
      from #3's merge log. All four candidates accepted in
      [#14](https://github.com/dnrohr/mathematical-structures/issues/14);
      seismic/acoustic imaging folded into `computational-imaging` as
      examples, Leontief input–output and econometric filtering recorded as
      rejects there.
- [x] [curation] Write the nodes and APPLIED-IN edges. Strength discipline as
      always: CT reconstruction _is_ inverse Radon (theorem); Murray's law is a
      variational model of a messy system (strong-analogy at best). Where a
      field names the problem itself differently, aliases carry it — done;
      graph-laplacian → pagerank also held below theorem on purpose (the
      exact statements live on the walk–generator correspondence), and the
      vascular gap edge stays an open §35 question, referenced not resolved.
- [x] [data] Symptom pass: `measurements-are-projections.worked_example` →
      `computational-imaging`; one new symptom (`ranking-network-importance`,
      worked example `pagerank`) for the recognition pattern the index lacked.
      No new `fields` ids — the validator never demanded one.
- [x] [build] `application/underconnected` warn rule per the exit criterion,
      with failing fixtures (§4.2 practice: every rule has a triggering test);
      documented in the ARCHITECTURE.md §4.2 table.
- [x] [app] `#/applications` index page (parallel to `#/moves`, reusing
      `views/common/` fragments and a shared `convergingStructures` accessor
      in `data/`); the landing page gains applications as the third entry
      point alongside symptoms and search, and the site nav links the index.
- [x] [app] Playwright: the application journey + index render, both themes —
      four tests in `m7-applications.spec.ts`, and the applications index
      joined the M6 axe matrix (WCAG 2.1 A/AA, light + dark).
- [x] [curation] Metrics re-read after the batch: applications surfacing as
      bridges in `#/metrics` is the thesis measured, but verify no overclaimed
      strength manufactured it (theorem-grade APPLIED-IN edges join the trusted
      subgraph); feed anything suspicious back into strengths or edge context.
      Verdict: `computational-imaging` is a real bridge (degree 4 trusted,
      betweenness 0.010 — the only node connecting the transform cluster's
      four members pairwise); `pagerank` and `resource-allocation` carry
      trusted degree 2 but zero betweenness because their structures were
      already directly connected (honest triangles, no manufactured
      centrality); `vascular-branching`'s analogy-grade edges correctly buy
      no metrics weight (trusted degree 1 via conservation-laws only).
      Nothing needed feeding back.

---

## M8 — Evidence and citations

**Goal:** the reserved `evidence` field becomes real — the map's checkable claims
carry literature, starting where M7 created the pressure.

**Exit criteria**

- [x] `graph/references.bib` exists; an `evidence` key that resolves to no entry
      fails the build; citations render wherever the owning edge renders —
      27 entries; `edge/unknown-evidence` is an error with a pipeline test
      (the M8 CI criterion, like M1's unknown-endpoint test), and both claim
      renderers (concept-page sentences and the lens/path/questions claim
      list) carry the marker, Playwright-proven in `m8-citations.spec.ts`.
- [x] Every nontrivial M7 application claim carries ≥ 1 citation, and the M5
      dogfood edge's literature trail (stability margins → biological
      regulation) lives in `evidence` keys, not only in notes prose — all
      12 APPLIED-IN edges cite 1–2 works each; the dogfood edge carries its
      six-key trail (two textbooks, three worked loops, the secant-criterion
      generalization) with the notes rewritten to point at the keys.
- [x] `graph.json` gains references additively (minor bump, documented in
      `docs/graph-json.md`) — 1.2.0: top-level `references` (resolved,
      sorted) plus `evidence` on node connections; GraphML/CSV exports carry
      the keys semicolon-joined.

**Tasks**

- [x] [build] Stage-1 reader for `graph/references.bib`; validation: unknown
      `evidence` key = error, unused reference = info (a curation hint, like
      candidate edges); deterministic emit of resolved references into
      `graph.json` — the reader is a deliberately strict BibTeX subset
      (concrete entries, plain UTF-8, no macros; stray text is an error so a
      typo'd entry cannot silently vanish), each rule with failing fixtures
      per §4.2 practice; determinism holds via the existing double-build test.
- [x] [app] Citation affordance on edge sentences (compact marker expanding to
      the full reference) and a per-page "Sources" list aggregating the works
      cited by the node's edges; `#/questions` shows the literature trail on
      checked gap edges — a native `<details>` disclosure ("N sources"), no
      script; the questions view inherits it through the shared edge-claim
      fragment (lens-proven in Playwright, since no gap edge is checked yet)
      and its workflow step 6 now says to record the trail as evidence keys.
- [x] [curation] Backfill pass, strongest claims first: the M7 batch, the three
      MIGRATED-TO edges, and the converted M5 gap edge — 15 edges cite 27
      works (all cited, so `reference/unused` stays quiet); DOIs/URLs only
      where verified, en-dashes and diacritics written directly.
- [x] [infra] CONTRIBUTING: how to add a reference and cite it from an edge
      (the "cite the literature" walkthrough, with the strength-stays-honest
      rule); the edge-proposal issue form's evidence field now says how named
      literature lands as `references.bib` keys.

---

## M9 — Learning paths

**Goal:** guided walks through the graph exist as validated content with a
step-through UI; M7's applications are the natural spines.

**Exit criteria**

- [x] `paths/*.yaml` is a compiled, validated content type: a step slug that
      doesn't exist fails the build; consecutive steps with no typed edge
      between them must carry a bridging note saying why the walk jumps —
      `walk/unknown-step` and `walk/unbridged-jump` are errors with pipeline
      tests (the M9 CI criteria, like M1's unknown-endpoint test), plus
      shape/too-short/duplicate-step errors and a stub-step warn, each with
      failing fixtures per §4.2 practice. Both example walks exercise the
      bridge path for real: their deliberate jumps carry the required notes,
      rendered as flagged jumps in the UI.
- [x] ≥ 2 walks shipped — landed at 3 (`sar-tour`, spined on M7's
      `computational-imaging`; `eigenvalue-tour`;
      `random-walk-to-renormalization`), each reachable from `#/walks` (site
      nav) and from every member concept's "Appears in walks" section, which
      links straight to the concept's step (Playwright-proven in
      `m9-walks.spec.ts`).
- [x] Walk position is shareable by URL and round-trips
      (`#/walk/<id>?step=<n>`, 1-based, clamped): URL → view, next/prev →
      URL, reload restores the step — Playwright-proven like the M4 view
      states.

**Tasks**

- [x] [data] Path file shape (`title`, `summary`, `steps: [{slug, note}]`,
      with the id as the filename — the concept-slug discipline) recorded in
      ARCHITECTURE.md §3.7 alongside the other content types before code
      existed — the reserved `paths/` directory finally has its contract.
- [x] [build] Stage-1 reader + the validation rules above; walks emitted into
      `graph.json` — 1.3.0 (additive minor), documented in
      `docs/graph-json.md`; connecting edges deliberately not embedded (the
      app joins steps against `edges`, so a walk can never contradict the
      edge list).
- [x] [app] Walk view (`#/walk/<id>`: current step with its "why this step"
      note, arrival claims or flagged jump, prev/next, position in the URL)
      reusing the path graph preset for the chain; walks index (`#/walks`);
      "appears in walks" backlinks on concept pages; Walks in the site nav.
- [x] [curation] Author 2–3 walks: the SAR tour, the eigenvalue tour, "from
      random walk to renormalization" (spec §8.3's examples plus one
      application spine) — landed at exactly those three; the two §8.3
      walks each carry one honest bridging jump, the SAR tour rides typed
      edges the whole way.
- [x] [app] Playwright: walk round-trip + concept-page backlink — four tests
      in `m9-walks.spec.ts` (round-trip incl. the flagged jump and step-list
      jump, index + nav, concept backlink to the exact step, chain graph in
      both themes), and both walk views joined the M6 axe matrix (WCAG 2.1
      A/AA, light + dark).

---

## M10 — Propose-an-edge: the contribution front door

**Goal:** a reader can propose an edge without knowing the repository layout, and
the validator remains the only gate.

**Exit criteria**

- [x] From any concept page and from `#/questions`, "propose an edge" reaches a
      prefilled GitHub issue carrying the claim in machine-usable form
      (from/to/type/strength/context) — still no server, no accounts (spec §6) —
      the `#/propose` composer deep-links the edge-proposal form with the claim
      both as a sentence and as the ready-to-paste `edges.yaml` block,
      Playwright-proven from both entry points in `m10-propose.spec.ts` (the
      M10 CI criterion, like the M3/M4 journeys).
- [x] One proposal has round-tripped end to end: filed through the form, landed
      as an ordinary validated PR (a dogfood pass, like M5's) — diffusion
      —REPRESENTED-BY→ eigenvalues, composed in `#/propose` from the diffusion
      concept page, filed via the composer's prefilled-issue mechanism as
      [#19](https://github.com/dnrohr/mathematical-structures/issues/19), and
      landed by copy-pasting the issue's block into `edges.yaml` (evidence key
      added per the form's Evidence field), validator green.

**Tasks**

- [x] [app] Proposal view (`#/propose?from=<slug>`): pickers constrained to the
      schema vocabularies already embedded in `graph.json`, deep-linking to the
      prefilled issue form (the ARCHITECTURE.md §9 mechanism) — draft state
      entirely in the URL like every view; the claim previews through the
      shared edge-claim fragment; existing edges between the chosen pair are
      surfaced against duplicates; POSSIBLE-MISSING-MIGRATION and `speculative`
      are deliberately absent (gap hypotheses route to their own issue form,
      which collects the §35 workflow fields).
- [x] [infra] Tighten the M6 edge-proposal issue form so the prefill
      round-trips as a copy-pasteable `edges.yaml` block — the form's `edge`
      field is a `render: yaml` textarea carrying exactly the entry a
      maintainer lands; unit tests YAML-parse the composer's block back to the
      proposed claim, free-text context included.
- [x] [app] Entry links: concept-page edge lists and `#/questions` candidate
      edges get "propose this" affordances — every concept page's connections
      block ends in the composer link (`from` prefilled), every candidate pair
      carries "propose" (both endpoints prefilled).
- [x] [curation] Dogfood: file one proposal through the form and land it —
      done for exactly the flow a reader gets (see the exit criterion above);
      the picked claim is a candidate-queue pair whose Fourier special case
      (`diffusion → fourier-analysis`) and graph half
      (`graph-laplacian → eigenvalues`) were already on the map, so the
      general spectral statement completes an honest triangle rather than
      inventing a connection.

---

## M11 — The work queue: selection without arbitrariness

**Goal:** expansion becomes demand-driven — the build computes every curation
signal from the data itself, each with its evidence, rejects become data, and
the app renders the queue (UI_REDESIGN.md §4.6).

**Exit criteria**

- [x] `graph.json` gains `metrics.queue` (link suggestions with their witness
      neighbors, community bridge deficits, recurring free-text assumptions,
      dialect gaps, thin symptoms) and top-level `non_edges` — additive minor
      bump documented in `docs/graph-json.md`; the double-build determinism
      test still holds — 1.4.0; the new blocks ride the same
      sorted-keys/stable-order emit path the determinism test covers, and
      the emit shape test pins them.
- [x] `graph/non-edges.yaml` is a validated content type: unknown endpoint =
      error, contradiction with an existing edge = error, and a ledger entry
      provably suppresses its candidate/suggestion queue items — each rule
      with a failing pipeline test (§4.2 practice, like M1's
      unknown-endpoint test) — `non-edge/unknown-endpoint` and
      `non-edge/contradiction` are the M11 pipeline criteria; suppression is
      proven twice (a pipeline test shows the candidate item vanish when the
      ledger entry lands, a stage-4 unit test the link suggestion); the
      shape/self-pair/duplicate/reason/`see` rules each carry failing
      fixtures.
- [x] `#/queue` renders every signal class with its machine-checkable "why"
      and a prefilled action per item (propose composer / issue form),
      Playwright-proven like the M4/M5 views and in the axe matrix — nine
      sections: the five new signals, the candidate-edge queue (moved here
      from `#/questions`, which keeps the §35 epistemology and cross-links
      its sibling), the M7/M8 underconnected-application and
      unused-reference rules as display joins, and the ledger rendered as
      "deliberate non-connections". `m11-queue.spec.ts` + the axe matrix in
      both themes.
- [x] Dogfood: one queue item worked end to end — landed as a validated
      edge/node PR, or recorded in `non-edges.yaml` with its reason (the
      M5/M10 pattern: the loop closes using the tool itself) —
      `kalman-filter ↔ state-space-model`, the queue's own top-band link
      suggestion (witnesses: bayes-rule, linear-gaussian-ssm), worked
      through the queue's "record a non-edge" action into
      [#23](https://github.com/dnrohr/mathematical-structures/issues/23)
      and landed in the ledger: the witnesses are exactly the triangle the
      map already closes deliberately through the special case, so the
      reviewed answer is a non-edge, and the rebuilt queue no longer asks
      (31 → 30 suggestions).

**Tasks**

- [x] [build] Stage 4 queue signals, deterministic and unit-tested on fixture
      graphs: shared-trusted-neighbor link suggestions (≥ 2 witnesses, listed;
      existing edges and non-edges excluded); bridge deficits (community pairs
      joined by ≤ 1 trusted edge); recurring assumptions (identical normalized
      free-text `assumptions` strings on ≥ 2 nodes); dialect gaps (field in
      `fields`, no alias, on nodes with ≥ 2 dialects); thin symptoms (< 2
      moves or no worked example). Plain, explainable math only — a signal a
      reader can't verify by eye doesn't ship — hand-checkable fixtures per
      signal (a 4-cycle whose both diagonals are suggested, the bridged
      cliques' one crossing edge, case/whitespace assumption variants);
      edges of *any* strength exclude a pair from suggestion, untrusted
      edges buy no witnesses, and slug-valued assumptions are typed
      references, never signals.
- [x] [build] `non-edges.yaml` stage-1 reader ({between: [a, b], reason,
      see?}) + the three validator rules + suppression wiring, with failing
      fixtures per rule — the file is optional content like walks; pairs
      normalize to sorted order on emit; `see` must be a concept slug or an
      http(s) URL.
- [x] [build] Emit `metrics.queue` + `non_edges`; document the shapes —
      graph.json 1.4.0 (additive minor), both shapes in
      `docs/graph-json.md`; ARCHITECTURE.md gains §3.8 (the content type)
      and the §4.2 rule rows.
- [x] [app] `#/queue` as `#/questions`' sibling (nav: "Open questions · Work
      queue"): items grouped by signal, evidence rendered inline, action
      deep-links; a "deliberate non-connections" section rendered from
      `non_edges` (for this project, "we checked — false friends" is content)
      — nav gains Queue beside Questions and the two views cross-link;
      bridge-deficit items render the one bridging claim through the shared
      edge-claim fragment plus each side's busiest members, with path and
      propose deep-links on the community hubs; "record a non-edge" is a
      prefilled issue carrying the ready-to-paste ledger entry (the M10
      mechanism, one artifact smaller — unit-tested to parse back).
- [x] [app] Playwright: each signal class renders + one action deep-link
      round-trip; both views join the axe matrix — four tests in
      `m11-queue.spec.ts` (all nine sections with data-driven counts and
      empty states, ledger + suppression against the emitted data, propose
      round-trip into the composer, sibling nav); `#/queue` joined the axe
      matrix in both themes, and the M10 candidate→composer journey now
      starts from its new home.
- [x] [curation] Seed `non-edges.yaml` with the rejects already recorded in
      [#3](https://github.com/dnrohr/mathematical-structures/issues/3) and
      [#14](https://github.com/dnrohr/mathematical-structures/issues/14), so
      the ledger starts honest and the queue starts suppressed-correctly —
      three seeds: the notebook §8 Kalman-filter ≠ HMM correction (#3's
      most-guarded distinction; its wiki-linked candidate pair is the
      ledger's first real suppression) and #14's two application rejects
      (Leontief viability, econometric filtering) as pair decisions.
- [x] [curation] Dogfood pass per the exit criterion — see above:
      [#23](https://github.com/dnrohr/mathematical-structures/issues/23),
      filed from the queue's own suggestion and landed as the ledger's
      fourth entry.

---

## M12 — Survey views: the matrix and the map

**Goal:** the atlas's negative space becomes visible — every pair and every
field membership on one screen each, absence included (UI_REDESIGN.md §4.3,
§4.4, §4.9).

**Exit criteria**

- [ ] `#/matrix`: a real-table adjacency matrix over the lens filter grammar
      (same params, same default strength floor), ordered by
      community/type/az/degree with labeled group blocks; cells carry the
      strength line grammar (never color-alone) with a ×n chip for parallel
      edges and the warn style for gap edges; a pair panel lists every claim
      between two nodes via the shared edge-claim fragment, with the propose
      composer prefilled on unconnected pairs; keyboard cell navigation;
      empty blocks between communities link the M11 bridge-deficit items.
      Playwright + axe, both themes; URL round-trip like every M4 view.
- [ ] `#/map`: structures × fields incidence with three visibly distinct,
      text-equivalent cell states (named dialect / present-unnamed / empty);
      present-unnamed cells link the dialect-gap queue items; row headers →
      concept dialect table, column headers → field-filtered lens.
      Playwright + axe, both themes; URL round-trip.
- [ ] Directed edges render arrowheads in all three force presets (symmetric
      types stay markerless — the absence is informative), smoke-tested with
      parallel-edge bows.
- [ ] Concept pages carry "see this node in: matrix · map" situating links
      (`focus=<slug>` crosshair/row highlight on the target views).

**Tasks**

- [ ] [app] Matrix view: shared filter parsing with lens; sticky headers;
      scroll container; block separators reusing the M5 community palette
      rules; live caption reuse; the >~150-node filter-required posture
      (mirrors the lens fallback) stated in the empty state.
- [ ] [app] Pair panel + propose prefill; `focus` param.
- [ ] [app] Map view: three cell states, span/type/az ordering, column
      highlight via `field=`.
- [ ] [app] Arrowheads in `graph-render/` (marker at target end only).
- [ ] [app] Situating links on concept pages.
- [ ] [app] Playwright suites + axe matrix membership for both views.

---

## M13 — The engineering applications wave, batch 1 (+ the Practitioner UI)

**Goal:** the third front door carries real engineering weight — a
queue-and-owner-sourced batch of application nodes lands into a UI shaped for
the engineer reading it (UI_REDESIGN.md §2.1, §4.1, §4.2). Batches repeat this
milestone's pattern; this one proves it at wave scale.

**Exit criteria**

- [ ] Batch fixed in a tracking issue before writing (the M2/M7 discipline):
      4–6 new `application` nodes, every one `established`, each with ≥ 2
      distinct structures converging over APPLIED-IN / MIGRATED-TO edges with
      honest strengths, per-edge context, and ≥ 1 citation on every
      nontrivial claim (the M8 bar). Tool-shaped candidates demote to
      structure nodes or aliases with the decision recorded (the tomography
      precedent).
- [ ] Landing v4: the applications door grouped by primary field with filter
      chips (`#/?af=<field>`), plus the survey strip linking the analytical
      views; symptom primacy untouched (spec §3.4). Playwright-proven.
- [ ] Application anatomy on `application` pages: incoming claims grouped by
      the structure's node type, each led by its edge context; the assumption
      surface (one-hop ASSUMES union of connected structures, clearly labeled
      as derived, FAILS-WHEN/REPLACED-BY adjacent) rendered beneath.
- [ ] Practitioner journey passes like M7's: search a domain term → the
      application page with anatomy + assumption surface → a connected
      structure page in ≤ 2 clicks (Playwright).

**Tasks**

- [ ] [curation] Inventory issue. Starting candidates from the owner's
      direction, each checked against the ≥ 2-structures bar before writing:
      weather prediction / data assimilation (kalman-filter, chaos,
      fourier-analysis, diffusion); antenna design (greens-function,
      eigenvalues, optimization, complex-analysis); protein folding
      (optimization, thermodynamic-entropy, markov-state models via
      hidden-markov-model); motor efficiency (feedback-control,
      conservation-laws, the force–voltage electromechanical analogy as
      ANALOGOUS-TO material); image registration / feature matching
      (diffusion via Gaussian scale space, eigenvalues via the structure
      tensor, optimization; SIFT/SURF as aliases). Tool-shaped names enter as
      structures or aliases instead: PCA stays the statistics alias on
      eigenvalues; FEA-shaped candidates land as operation content on or near
      variational-principles.
- [ ] [curation] Write nodes + edges with citations; new `fields` ids only as
      the validator demands them (RF/electromagnetics is the likely first —
      M7 needed none, this batch may).
- [ ] [data] Symptom pass: add the recognition patterns the batch exposes
      (M7 added `ranking-network-importance`; data assimilation and
      registration likely earn theirs).
- [ ] [app] Landing v4 (field grouping + chips + survey strip).
- [ ] [app] Application anatomy + assumption surface (display joins only — no
      new computation class client-side).
- [ ] [app] Playwright: practitioner journey, landing grouping round-trip,
      axe membership for changed views.
- [ ] [curation] Metrics re-read after the batch (the M7 discipline): confirm
      no overclaimed strength manufactured centrality; feed anything
      suspicious back into strengths or edge context.

---

## M14 — Pairs and orientation

**Goal:** the remaining redesign surfaces — comparing two concepts, situating
oneself in the whole atlas, faceted browsing, and the cross-view actions
polish (UI_REDESIGN.md §4.5, §4.7, §4.8, §5).

**Exit criteria**

- [ ] `#/compare/<a>/<b>`: side-by-side headers, the merged dialect table
      (one row per field in the union, both nodes' aliases aligned), direct
      claims, shared neighbors grouped by type, shared assumptions, path-view
      link; entered from a "compare…" action on concept pages; legitimate
      empty case handled (no implied claims). URL round-trip; Playwright +
      axe.
- [ ] `metrics.layout` in `graph.json` (additive minor): a deterministic
      build-time layout of the trusted subgraph (double-build byte equality),
      consumed by `#/atlas` — a fixed constellation, linked from nav and
      survey strip, never the homepage — and by a concept-page minimap
      ("you are here"). The >~100-trusted-node community-aggregation
      degradation is documented next to the view.
- [ ] `#/index` facets: node type / field / status chips with counts,
      AND-combining, state in the URL; the landing type-groups link into
      pre-filtered index states.
- [ ] Actions polish shipped and documented in the `?` panel: copy-link with
      the `generated_from` SHA, download-what-you-see CSV on matrix/map/lens,
      BibTeX export of a page's sources, walk resume and recently-visited
      trail (localStorage conveniences, graceful when absent).

**Tasks**

- [ ] [build] Stage 4 layout: deterministic force run over the trusted
      subgraph, rounded coordinates keyed by slug; unit-tested for
      determinism and emitted additively.
- [ ] [app] Atlas view + minimap; communities toggle reusing `communities=1`.
- [ ] [app] Compare view + concept-page entry; "atlas" joins the situating
      links.
- [ ] [app] Index facets.
- [ ] [app] Actions polish (client-generated blobs only; still no server).
- [ ] [app] Playwright + axe for every new/changed view.

---

## Later backlog (unscheduled; spec §8 owns the rationale)

- LLM-assisted authoring experiments — drafting node files in house style,
  free-text symptom matching, dialect-aware gap literature search — always landing
  as ordinary validated PRs (§8.4).
- `atlas-build --content DIR` hardening for forked atlases (§8.5).
- Scale work (per-node JSON, pagination) when node count approaches ~100 (§8.6).
- Additional export formats on demand (§8.7).
- Content expansion beyond the v1 set, driven by the M11 work queue
  (`#/queue`): fill structural holes rather than
  chasing coverage — standing work that runs alongside the milestones above,
  not after them. Application batches after M13's repeat its pattern
  (tracking issue → honest bar → metrics re-read), sourced from the queue.

## Standing curation (no milestone; tracked in #3)

- Peer-review of `graph/edges.yaml` as a set — the one unchecked M2 task; owner
  work, being worked through incrementally. By owner decision it is standing
  work, not a gate on M11–M14 or the applications wave.
- Triage of the info-level candidate edges (55 after M11 — M10's dogfood
  landed one as an edge, and the ledger's first entry suppressed another as
  a reviewed non-edge) into typed edges or `non-edges.yaml` entries; the
  M11 queue renders both queues with prefilled actions.
- Possible extraction of `wavelets` from `integral-transforms` once there is
  enough content.

## Risks worth naming now

| Risk | Mitigation baked into the plan |
| --- | --- |
| Edge curation quality drifts (analogies overclaimed) | strengths are schema-enforced; epistemic validator rules; M2's read-every-claim review; M5 dogfood pass |
| Application nodes drift toward encyclopedia breadth (M7) | the ≥ 2-structures bar is a validator rule; rejects demote to canonical examples; the batch is fixed in a tracking issue before writing |
| Content extraction stalls (it's the real work) | M2 runs beside M1; template-setting five nodes first; stubs are legal and visible |
| Graph views balloon in scope | one shared renderer, three presets, "no full graph" rule, no camera controls in v1 |
| Solo-maintainer bus factor | everything is plain files + one boring build; CONTRIBUTING and validator make drive-by PRs safe |
| Schema churn after content exists | schema.yaml changes are one-file diffs, and the validator instantly reports every file the change breaks |
