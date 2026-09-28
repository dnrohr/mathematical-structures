---
canonical_name: Coupling method
node_type: operation
status: established
summary: A coupling bounds mixing by constructing two copies that eventually coalesce.
fields:
  - probability
  - statistics
assumptions:
  - correct marginal transition laws
canonical_examples:
  - Markov chains admitting a jointly constructed coupling. — Markov chains admitting a jointly
    constructed coupling.
sections:
  - campaign-cross-field-sweep-2026-09#coupling-method
---

A coupling bounds mixing by constructing two copies that eventually coalesce.

## Mathematical skeleton

The coupling inequality bounds total variation by the probability that coupled states differ.

The claim is scoped to Markov chains admitting a jointly constructed coupling. Its stated validity regime is: The stated claim is limited to markov chains admitting a jointly constructed coupling.

## Boundaries

- A poorly chosen coupling can give a vacuous bound.

Counterexamples and failure probes:

- Independent copies may meet far later than an optimized coupling.

## Adversarial review

**Challenge.** Boundary test: A poorly chosen coupling can give a vacuous bound.

**Response.** The proposition is restricted to markov chains admitting a jointly constructed coupling, and the caveat remains explicit.
