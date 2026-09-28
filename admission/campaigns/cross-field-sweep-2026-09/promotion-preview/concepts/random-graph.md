---
canonical_name: Random graph
node_type: model
status: established
summary: A random graph is a probability distribution over graph-valued outcomes.
fields:
  - networks
  - probability
assumptions:
  - explicit probability model
canonical_examples:
  - Finite random graph ensembles. — Finite random graph ensembles.
sections:
  - campaign-cross-field-sweep-2026-09#random-graph
---

A random graph is a probability distribution over graph-valued outcomes.

## Mathematical skeleton

Edges, degrees, or other structure are sampled according to a specified generative law.

The claim is scoped to Finite random graph ensembles. Its stated validity regime is: The stated claim is limited to finite random graph ensembles.

## Boundaries

- Different ensembles with similar mean degree can have different higher-order structure.

Counterexamples and failure probes:

- A configuration model and an Erdos-Renyi graph can share mean degree but differ in degree variance.

## Adversarial review

**Challenge.** Boundary test: Different ensembles with similar mean degree can have different higher-order structure.

**Response.** The proposition is restricted to finite random graph ensembles, and the caveat remains explicit.
