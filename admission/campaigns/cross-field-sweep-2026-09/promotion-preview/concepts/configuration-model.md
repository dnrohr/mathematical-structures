---
canonical_name: Configuration model
node_type: model
status: established
summary: The configuration model samples graphs constrained by a prescribed degree sequence or
  degree distribution.
fields:
  - networks
  - probability
assumptions:
  - graphical or pairable degree sequence
canonical_examples:
  - Sparse undirected networks under the specified simple-graph or multigraph convention. — Sparse
    undirected networks under the specified simple-graph or multigraph convention.
sections:
  - campaign-cross-field-sweep-2026-09#configuration-model
---

The configuration model samples graphs constrained by a prescribed degree sequence or degree distribution.

## Mathematical skeleton

Half-edges are paired at random, producing a null model that controls degrees.

The claim is scoped to Sparse undirected networks under the specified simple-graph or multigraph convention. Its stated validity regime is: The stated claim is limited to sparse undirected networks under the specified simple-graph or multigraph convention.

## Boundaries

- The basic pairing construction permits self-loops and parallel edges.

Counterexamples and failure probes:

- Conditioning on simplicity can materially change probabilities for heavy-tailed degrees.

## Adversarial review

**Challenge.** Boundary test: The basic pairing construction permits self-loops and parallel edges.

**Response.** The proposition is restricted to sparse undirected networks under the specified simple-graph or multigraph convention, and the caveat remains explicit.
