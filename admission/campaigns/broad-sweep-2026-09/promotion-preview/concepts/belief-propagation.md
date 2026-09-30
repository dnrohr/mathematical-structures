---
canonical_name: Belief propagation
node_type: operation
status: established
summary: Sum-product belief propagation computes exact marginals on tree-structured factor graphs,
  including chain-structured hidden Markov models.
fields:
  - ml
  - probability
  - statistics
aliases:
  - name: sum-product / belief propagation
    field: statistics
  - name: sum-product algorithm
    field: ml
  - name: message passing
    field: probability
assumptions:
  - acyclic factor graph
  - finite or integrable factors
canonical_examples:
  - Tree factor graphs and chain HMMs. — Sum-product messages on a tree; loopy graphs lose the
    exactness guarantee.
sections:
  - campaign-broad-sweep-2026-09#belief-propagation
---

Sum-product belief propagation computes exact marginals on tree-structured factor graphs, including chain-structured hidden Markov models.

## Mathematical skeleton

Local messages eliminate subtrees and combine by products and marginalizing sums or integrals.

The claim is scoped to Tree factor graphs and chain HMMs. Its stated validity regime is: Exact on trees; iterative heuristic on loopy graphs.

## Boundaries

- Loopy belief propagation may fail to converge or return inexact beliefs.

Counterexamples and failure probes:

- A frustrated cycle with nonconvergent message updates.

## Adversarial review

**Challenge.** The common loopy algorithm does not inherit tree exactness.

**Response.** Exactness is explicitly limited to trees, with loopy use marked heuristic.
