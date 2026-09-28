---
canonical_name: Metropolis-Hastings algorithm
node_type: operation
status: established
summary: Metropolis-Hastings constructs a reversible Markov chain with a prescribed stationary distribution.
fields:
  - probability
  - statistics
assumptions:
  - computable density ratio
  - irreducible proposal on target support
canonical_examples:
  - Targets and proposals with compatible support. — Targets and proposals with compatible support.
sections:
  - campaign-cross-field-sweep-2026-09#metropolis-hastings-algorithm
---

Metropolis-Hastings constructs a reversible Markov chain with a prescribed stationary distribution.

## Mathematical skeleton

An acceptance ratio corrects a proposal kernel so detailed balance holds for the target law.

The claim is scoped to Targets and proposals with compatible support. Its stated validity regime is: The stated claim is limited to targets and proposals with compatible support.

## Boundaries

- Stationarity does not guarantee rapid mixing.

Counterexamples and failure probes:

- A local proposal on a multimodal target can mix exponentially slowly.

## Adversarial review

**Challenge.** Boundary test: Stationarity does not guarantee rapid mixing.

**Response.** The proposition is restricted to targets and proposals with compatible support, and the caveat remains explicit.
