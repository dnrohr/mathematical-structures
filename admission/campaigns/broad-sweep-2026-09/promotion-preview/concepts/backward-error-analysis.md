---
canonical_name: Backward error analysis
node_type: move
status: established
summary: Backward error analysis interprets a numerical trajectory as the exact trajectory of a
  nearby modified differential equation.
fields:
  - mechanics
  - numerical-analysis
assumptions:
  - smooth or analytic vector field
  - sufficiently small step size
canonical_examples:
  - One-step integrators for smooth ODEs. — Truncated modified equations for sufficiently smooth or
    analytic dynamics.
sections:
  - campaign-broad-sweep-2026-09#backward-error-analysis
---

Backward error analysis interprets a numerical trajectory as the exact trajectory of a nearby modified differential equation.

## Mathematical skeleton

Choose modified vector-field coefficients so its exact flow matches the numerical one step map order by order.

The claim is scoped to One-step integrators for smooth ODEs. Its stated validity regime is: Finite truncation, or exponentially long regimes under analyticity hypotheses.

## Boundaries

- The full modified series commonly diverges and is used asymptotically.

Counterexamples and failure probes:

- Nonsmooth dynamics where the required derivatives do not exist.

## Adversarial review

**Challenge.** Calling the numerical solution exact may hide truncation and divergence.

**Response.** The claim says nearby truncated modified equation and states the asymptotic limitation.
