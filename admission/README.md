# Admission dossiers

This directory is the untrusted pre-admission area. Nothing here is compiled
into `graph.json`, included in trusted graph metrics, or promoted automatically.
See [the architecture and workflow](../docs/candidate-validation.md) and the
[rule catalogue](RULES.md).

## Format

`dossier-schema-v1.yaml` is a YAML-encoded JSON Schema for version `1.0.0`.
Fields marked `x-atlas-vocabulary` are intentionally not enumerated: the CLI
resolves them from `graph/schema.yaml`, the atlas's only vocabulary source.

The top-level sections keep provenance categories visibly separate:

- `candidate`, `source_inventory`, and `claims` are supplied assertions;
- `generated_hypotheses` are ideas, not facts;
- `search` records dialect-aware queries and their bounded results;
- claim `source_assessments` say exactly what proposition a source supports,
  where, and who or what assessed it;
- `automated_judgments` and `adversarial_reviews` remain untrusted judgments
  with their own method and provenance. Optional judgments can recommend an
  edge-type change, reversal, lower strength, claim split, merge, example
  demotion, or rejection, but the deterministic core never silently applies
  those suggestions;
- `workflow.history` is append-only and `human_decisions` is reserved for
  explicit curator decisions.

Endpoints in a proposed claim may use an existing atlas slug, the candidate's
id, or `$candidate`. The last two are adapted to a temporary in-memory concept
only for calling the existing trusted validator; no concept file is created.

Evidence statuses are `direct-support`, `qualified-support`, `background-only`,
`contradiction`, `irrelevant-co-mention`, and `unable-to-assess`. Background or
co-mention never counts as support. A `not-located` search result never counts
as evidence of absence.

## CLI

Run the deterministic offline review in either representation:

```sh
npm run admit -- --format text admission/examples
npm run admit -- --format json admission/examples
npm run admit -- --format json path/to/one-dossier.yaml
```

Inputs and directories are sorted, JSON object keys are sorted, and no
timestamps are generated, so identical inputs produce byte-identical output.
The command writes nothing; redirect output only to an untrusted report
location if a saved report is wanted. Exit code `1` means one or more dossiers
has deterministic errors; `2` means CLI usage or file access failed.

The two examples exercise distinct outcomes: SVD is a strong node candidate
that can progress to human review, while principal components matches the
existing `eigenvalues` dialect and is recommended for merge/refinement.
