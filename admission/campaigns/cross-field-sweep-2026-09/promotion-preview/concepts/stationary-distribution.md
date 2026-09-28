---
canonical_name: Stationary distribution
node_type: object
status: established
summary: A stationary distribution is unchanged by one transition of a Markov chain.
fields:
  - probability
  - statistics
assumptions:
  - stochastic transition matrix
canonical_examples:
  - Finite-state Markov chains. — Finite-state Markov chains.
sections:
  - campaign-cross-field-sweep-2026-09#stationary-distribution
---

A stationary distribution is unchanged by one transition of a Markov chain.

## Mathematical skeleton

The probability row vector π satisfies πP = π.

The claim is scoped to Finite-state Markov chains. Its stated validity regime is: The stated claim is limited to finite-state Markov chains.

## Boundaries

- Stationarity need not be unique without irreducibility.

Counterexamples and failure probes:

- A chain with two closed classes has multiple stationary distributions.

## Adversarial review

**Challenge.** Boundary test: Stationarity need not be unique without irreducibility.

**Response.** The proposition is restricted to finite-state Markov chains, and the caveat remains explicit.
