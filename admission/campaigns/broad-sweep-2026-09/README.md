# Broad sweep 2026-09

This is the first source-driven admission campaign. It is deliberately not a
list of requested terms: nine contrasting textbook inventories define the
sampling frame, and the user's named concepts serve only as acceptance probes
inside that broader frame.

## Reproduce

```powershell
npm run harvest -- --manifest admission/campaigns/broad-sweep-2026-09/harvest.yaml --out admission/campaigns/broad-sweep-2026-09/normalized
npm run triage -- --campaign admission/campaigns/broad-sweep-2026-09 --manifest admission/campaigns/broad-sweep-2026-09/triage.yaml
npm run evidence -- --campaign admission/campaigns/broad-sweep-2026-09 --pack admission/campaigns/broad-sweep-2026-09/evidence-pack.yaml
npm run admit -- --format text admission/campaigns/broad-sweep-2026-09/normalized
npm run promotion-preview -- --campaign admission/campaigns/broad-sweep-2026-09 --out admission/campaigns/broad-sweep-2026-09/promotion-preview
```

All generated files stay under `admission/`. None of these commands can write
trusted atlas content.

## Measured funnel

| Stage | Count |
| --- | ---: |
| Authoritative source inventories | 9 |
| Raw source entries | 141 |
| Cross-source duplicates consolidated | 6 |
| Normalized survivors | 135 |
| Exact existing-atlas matches | 1 |
| Near-name review signals | 4 |
| Exhaustively classified survivors | 135 |
| Proposition-level evidence dossiers | 40 |
| Separate adversarial reviews | 40 |
| Deterministic validation errors | 0 |
| Review-ready new-node dossiers | 39 |
| Existing-node merge/refinement dossiers | 1 |
| Promotion-preview concepts | 39 |
| Promotion-preview typed edges | 40 |
| Promotion-preview reference additions | 6 |
| Integrated trusted-validator errors/warnings | 0 / 0 |

Raw-to-enriched yield is 28.4% (40 / 141). Normalized-to-enriched yield is
29.6% (40 / 135). The campaign records automated execution reproducibly but
does not invent human review minutes; elapsed human review time and accepted
claims per review hour remain blank until an actual reviewer performs the
promotion gate.

## Triage distribution

The checked `triage-report.json` records 104 node proposals, 2 edge proposals,
1 alias proposal, 1 merge/refinement, 5 retained examples, 1 application
proposal, 2 deliberate non-edges, 15 deferrals, and 4 rejections. The 40-item
review queue is a separate bounded budget, not a synonym for all node
proposals.

## Promotion boundary

The enriched dossiers stop at `automated-review-passed`. They contain source
locations and model-assisted adversarial review, but no fabricated human
decision. Promotion requires a reviewer to inspect the atomic proposition,
edge type, strength, assumptions, caveats, counterexamples, and source
assessment, then record a human disposition before any material enters
`concepts/` or `graph/`.

`promotion-preview/` makes that decision concrete without crossing the trust
boundary. It contains the exact concept Markdown, typed edges, and bibliography
additions that would be proposed. The preview command materializes an isolated
combined atlas in an operating-system temporary directory, runs the ordinary
trusted compiler, normalizes temporary paths out of its byte-stable report,
and deletes the temporary tree. It refuses output paths inside `concepts/`,
`graph/`, or `paths/`.
