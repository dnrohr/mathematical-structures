---
canonical_name: Bayesian network
node_type: model
status: established
summary: A Bayesian network factorizes a joint distribution according to a directed acyclic graph
  and applies Bayes rule for probabilistic inference.
fields:
  - ml
  - probability
  - statistics
aliases:
  - name: belief network
    field: probability
  - name: directed graphical model
    field: ml
assumptions:
  - directed acyclic graph
  - local Markov property
canonical_examples:
  - Discrete or continuous Bayesian networks with well-defined conditional densities. — Directed
    acyclic graphical models with normalized conditional distributions.
sections:
  - campaign-broad-sweep-2026-09#bayesian-network
---

A Bayesian network factorizes a joint distribution according to a directed acyclic graph and applies Bayes rule for probabilistic inference.

## Mathematical skeleton

p(x_1,...,x_n) equals the product over nodes of p(x_i given its parents).

The claim is scoped to Discrete or continuous Bayesian networks with well-defined conditional densities. Its stated validity regime is: Distributions Markov with respect to the graph.

## Boundaries

- The graph alone does not imply causal semantics.

Counterexamples and failure probes:

- A directed cyclic model is not a Bayesian network under this definition.

## Adversarial review

**Challenge.** Directed edges are often misread as causal claims.

**Response.** The proposition is purely probabilistic; causality is an additional interpretation.
