---
canonical_name: B-series
node_type: object
status: established
summary: A B-series is a rooted-tree-indexed formal series expansion used to represent Runge-Kutta
  flows and their compositions.
fields:
  - mechanics
  - numerical-analysis
assumptions:
  - sufficient derivatives of the vector field
canonical_examples:
  - Formal local expansions for sufficiently smooth autonomous ODEs. — Formal expansions for
    numerical flows of ODEs.
sections:
  - campaign-broad-sweep-2026-09#b-series
---

A B-series is a rooted-tree-indexed formal series expansion used to represent Runge-Kutta flows and their compositions.

## Mathematical skeleton

Coefficients are indexed by rooted trees whose elementary differentials encode derivative compositions.

The claim is scoped to Formal local expansions for sufficiently smooth autonomous ODEs. Its stated validity regime is: Formal order analysis and convergent regimes where the series is controlled.

## Boundaries

- Not every geometric integrator is representable by an ordinary B-series.

Counterexamples and failure probes:

- Aromatic series require graph structures beyond rooted trees.

## Adversarial review

**Challenge.** The label can refer to a formal algebra, a method expansion, or the exact flow.

**Response.** The node encompasses the rooted-tree formalism and distinguishes those uses in scope notes.
