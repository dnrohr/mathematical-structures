---
canonical_name: Mixing time
node_type: principle
status: established
summary: Mixing time quantifies how long a Markov chain takes to approach stationarity in total
  variation distance.
fields:
  - probability
  - statistics
assumptions:
  - unique stationary distribution
canonical_examples:
  - Finite irreducible aperiodic chains. — Finite irreducible aperiodic chains.
sections:
  - campaign-cross-field-sweep-2026-09#mixing-time
---

Mixing time quantifies how long a Markov chain takes to approach stationarity in total variation distance.

## Mathematical skeleton

It is the first time after which the worst-start total variation distance falls below a fixed threshold.

The claim is scoped to Finite irreducible aperiodic chains. Its stated validity regime is: The stated claim is limited to finite irreducible aperiodic chains.

## Boundaries

- The numerical value depends on the distance threshold convention.

Counterexamples and failure probes:

- A periodic chain need not converge in total variation.

## Adversarial review

**Challenge.** Boundary test: The numerical value depends on the distance threshold convention.

**Response.** The proposition is restricted to finite irreducible aperiodic chains, and the caveat remains explicit.
