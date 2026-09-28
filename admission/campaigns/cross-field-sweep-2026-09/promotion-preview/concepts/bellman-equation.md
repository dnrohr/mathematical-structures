---
canonical_name: Bellman equation
node_type: model
status: established
summary: The Bellman equation represents optimal sequential decision making through a one-step
  recursion in value.
fields:
  - control
  - optimization
assumptions:
  - Markov state description
  - optimal substructure
canonical_examples:
  - Finite-horizon problems and discounted or proper infinite-horizon variants. — Finite-horizon
    problems and discounted or proper infinite-horizon variants.
sections:
  - campaign-cross-field-sweep-2026-09#bellman-equation
---

The Bellman equation represents optimal sequential decision making through a one-step recursion in value.

## Mathematical skeleton

Optimal cost equals the best immediate cost plus the value of the successor state.

The claim is scoped to Finite-horizon problems and discounted or proper infinite-horizon variants. Its stated validity regime is: The stated claim is limited to finite-horizon problems and discounted or proper infinite-horizon variants.

## Boundaries

- Undiscounted improper problems may have multiple or pathological fixed points.

Counterexamples and failure probes:

- A negative-cost cycle makes total cost unbounded below.

## Adversarial review

**Challenge.** Boundary test: Undiscounted improper problems may have multiple or pathological fixed points.

**Response.** The proposition is restricted to finite-horizon problems and discounted or proper infinite-horizon variants, and the caveat remains explicit.
