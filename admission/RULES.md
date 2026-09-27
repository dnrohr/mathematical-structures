# Candidate-validation rule catalogue

Rule ids are stable report API. Changing a rule's meaning requires a new id.
Severities are `error`, `warn`, and `info`; kinds identify what can run offline.

| Rule id | Severity | Kind | Meaning |
| --- | --- | --- | --- |
| `admission/yaml` | error | deterministic | Dossier YAML cannot be parsed. |
| `admission/root` | error | deterministic | Root is not a mapping. |
| `admission/schema-version` | error | deterministic | Unsupported dossier schema. |
| `admission/required` | error | deterministic | Required dossier data is absent or malformed. |
| `admission/id` | error | deterministic | Candidate, claim, source, or query id is invalid/duplicated. |
| `admission/vocabulary` | error | deterministic | Atlas-controlled value is absent from `graph/schema.yaml`. |
| `admission/source-reference` | error | deterministic | A dossier reference points to an unknown source/query/claim. |
| `admission/workflow-transition` | error | deterministic | History is discontinuous or contains a forbidden transition. |
| `admission/workflow-state` | error | deterministic | Current state differs from append-only history. |
| `admission/evidence-status` | error | deterministic | Claim-source assessment status is unknown. |
| `admission/evidence-proposition` | error | deterministic | Assessment does not name the proposition being checked. |
| `admission/evidence-location` | error | deterministic | Assessment lacks a source location or excerpt. |
| `admission/evidence-co-mention` | info | deterministic | Co-mention/background was recorded and is not counted as support. |
| `admission/retrieval-not-absence` | warn | deterministic | Failed retrieval cannot establish an absent migration. |
| `admission/atlas-invalid` | error | deterministic | Trusted atlas must validate before candidate comparison. |
| `admission/trusted-rule` | inherited | deterministic | Result adapted from the existing `validateContent` rule named in provenance. |
| `admission/name-match` | info | deterministic | Canonical/alias/acronym lexical match against an atlas record. |
| `admission/near-name` | info | deterministic | Transparent token similarity suggests review, never identity. |
| `admission/application-connectivity` | warn | deterministic | Proposed application has fewer than two structure neighbors. |
| `admission/claim-support` | warn | deterministic | Atomic claim has no direct or qualified support assessment. |
| `admission/qualified-strength` | warn | deterministic | Qualified-only evidence may warrant weaker strength. |
| `admission/adversarial-review` | warn | deterministic | No separate adversarial review is recorded before automated pass. |
| `admission/review-ready` | info | deterministic | Structural checks permit human review; this is not a truth or evidence verdict. |
| `retrieval/source-located` | info | retrieval-dependent | Optional adapter located a source; the source still needs assessment. |
| `model/identity-match` | info | model-assisted | Optional semantic identity signal; never an automatic merge. |
| `model/ontological-fit` | info | model-assisted | Recorded category/granularity judgment with model provenance. |
| `model/claim-entailment` | info | model-assisted | Recorded claim/source judgment; never established fact by itself. |
| `model/adversarial-review` | info | model-assisted | Separate model pass challenges, weakens, or reinterprets a candidate. |

The deterministic CLI emits the deterministic rules and preserves supplied
retrieval/model judgments in distinct sections. It never synthesizes the four
adapter rule families.
