---
canonical_name: Factor graph
node_type: object
status: established
summary: A factor graph represents a global function or probability distribution as a bipartite
  graph of variables and local factors.
fields:
  - control
  - ml
  - probability
  - statistics
aliases:
  - name: factor graph / sparse estimation graph
    field: control
  - name: factorization graph
    field: probability
  - name: bipartite factorization graph
    field: ml
  - name: factorized graphical model
    field: statistics
assumptions:
  - specified factorization
canonical_examples:
  - Finite factorization graphs, including temporal state-space models. — State-space joint
    distributions factorized into transition and observation factors.
sections:
  - campaign-broad-sweep-2026-09#factor-graph
---

A factor graph represents a global function or probability distribution as a bipartite graph of variables and local factors.

## Mathematical skeleton

f(x_1,...,x_n) equals a product of factors f_a over subsets of variables adjacent to each factor node.

The claim is scoped to Finite factorization graphs, including temporal state-space models. Its stated validity regime is: Exact representation when the product equals the target function.

## Boundaries

- Graph cycles affect inference algorithms but not the validity of the factorization.

Counterexamples and failure probes:

- A missing factor that changes the represented joint distribution.

## Adversarial review

**Challenge.** A factor graph is a representation, not an inference algorithm.

**Response.** The claim confines the node to representation and leaves message passing separate.
