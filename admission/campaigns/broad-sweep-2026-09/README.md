# Broad sweep 2026-09

This is the first source-driven admission campaign. It is deliberately not a
list of requested terms: nine contrasting textbook inventories define the
sampling frame, two proposition-specific sources strengthen the final
evidence, and the user's named concepts serve only as acceptance probes inside
that broader frame.

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
| Authoritative sources | 11 |
| Raw source entries | 141 |
| Cross-source duplicates consolidated | 6 |
| Normalized survivors | 135 |
| Exact existing-atlas matches | 1 |
| Near-name review signals | 4 |
| Exhaustively classified survivors | 135 |
| Proposition-level evidence dossiers | 40 |
| Separate adversarial reviews | 40 |
| Independent model-assisted re-reviews | 40 |
| Substantive revisions after re-review | 9 |
| Deterministic validation errors | 0 |
| Review-ready new-node dossiers | 39 |
| Existing-node merge/refinement dossiers | 1 |
| Promotion-preview concepts | 39 |
| Promotion-preview typed edges | 40 |
| Promotion-preview reference additions | 8 |
| Integrated trusted-validator errors/warnings | 0 / 0 |
| Human decisions recorded | 40 |
| Approved dossiers | 40 |
| Promoted new concepts | 39 |
| Promoted merge/refinement edges | 1 |

Raw-to-enriched yield is 28.4% (40 / 141). Normalized-to-enriched yield is
29.6% (40 / 135), and human-review acceptance yield is 100% (40 / 40). The
repository owner approved all 40 dossiers on 2026-09-28. Active review minutes
were reported as 0 because approval was given without per-dossier review.
Accepted claims per review hour is therefore explicitly not applicable rather
than represented as an infinite or fabricated rate; `admission-result.json`
records the measured zero-minute effort and a null derived rate.

A later model-assisted independent audit reviewed all 40 propositions without
claiming additional human time. It retained 31 without substantive change,
revised 9 and retained them, rejected none, and replaced every generic source
assessment with a chapter/section/page or equation pinpoint. The audit is
recorded in `independent-review.yaml` and as a second adversarial-review record
in each selected dossier.

## Triage distribution

The checked `triage-report.json` records 104 node proposals, 2 edge proposals,
1 alias proposal, 1 merge/refinement, 5 retained examples, 1 application
proposal, 2 deliberate non-edges, 15 deferrals, and 4 rejections. The 40-item
review queue is a separate bounded budget, not a synonym for all node
proposals.

## Promotion boundary

Before approval, enriched dossiers stopped at `automated-review-passed` and
contained no fabricated human decision. The repository owner's explicit bulk
approval and the subsequent promotion are now recorded as terminal workflow
states. The independent model-assisted audit is separate from that human
decision and records zero added human minutes.

`promotion-preview/` makes that decision concrete without crossing the trust
boundary. It contains the exact concept Markdown, typed edges, and bibliography
additions that would be proposed. The preview command materializes an isolated
combined atlas in an operating-system temporary directory, runs the ordinary
trusted compiler, normalizes temporary paths out of its byte-stable report,
and deletes the temporary tree. It refuses output paths inside `concepts/`,
`graph/`, or `paths/`.

On 2026-09-28 the repository owner explicitly approved all 40 items. The 39
new-node proposals and the Kalman-filter edge refinement were then admitted as
ordinary trusted content, with the decision and terminal workflow transition
recorded in every reviewed dossier.

## UI evidence

- `artifacts/ui/broad-sweep-promotion/graphslam-concept.png` shows a promoted
  concept with its scoped claim, assumptions, counterexample, adversarial
  review, citation, and typed neighborhood.
- `artifacts/ui/broad-sweep-promotion/principle-lens.png` shows the expanded
  atlas retaining a legible fixed-layout lens after the node-count increase.
