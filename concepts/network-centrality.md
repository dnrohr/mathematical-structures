---
canonical_name: Network centrality
node_type: principle
status: established
summary: Network centrality assigns node scores intended to quantify a chosen notion of structural
  importance.
fields:
  - networks
  - probability
assumptions:
  - chosen graph direction and weighting conventions
canonical_examples:
  - Finite networks with a declared centrality definition. — Finite networks with a declared
    centrality definition.
sections:
  - campaign-cross-field-sweep-2026-09#network-centrality
---

Network centrality assigns node scores intended to quantify a chosen notion of structural importance.

## Mathematical skeleton

Degree, paths, eigenvectors, or random-walk visitation induce distinct score functionals.

The claim is scoped to Finite networks with a declared centrality definition. Its stated validity regime is: The stated claim is limited to finite networks with a declared centrality definition.

## Boundaries

- Centrality is not a single invariant notion of importance.

Counterexamples and failure probes:

- A bridge node can have high betweenness but low eigenvector centrality.

## Adversarial review

**Challenge.** Boundary test: Centrality is not a single invariant notion of importance.

**Response.** The proposition is restricted to finite networks with a declared centrality definition, and the caveat remains explicit.
