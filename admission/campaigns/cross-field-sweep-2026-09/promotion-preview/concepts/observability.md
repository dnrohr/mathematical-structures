---
canonical_name: Observability
node_type: principle
status: established
summary: Observability determines whether an initial state is uniquely recoverable from input-output data.
fields:
  - control
  - mechanics
assumptions:
  - known input
  - noise-free finite observation interval
canonical_examples:
  - Finite-dimensional continuous-time LTI systems. — Finite-dimensional continuous-time LTI systems.
sections:
  - campaign-cross-field-sweep-2026-09#observability
---

Observability determines whether an initial state is uniquely recoverable from input-output data.

## Mathematical skeleton

Full rank of the observability matrix eliminates indistinguishable state directions.

The claim is scoped to Finite-dimensional continuous-time LTI systems. Its stated validity regime is: The stated claim is limited to finite-dimensional continuous-time LTI systems.

## Boundaries

- Poor observability can make reconstruction numerically fragile before rank is lost.

Counterexamples and failure probes:

- Nearly collinear output modes produce an ill-conditioned observability matrix.

## Adversarial review

**Challenge.** Boundary test: Poor observability can make reconstruction numerically fragile before rank is lost.

**Response.** The proposition is restricted to finite-dimensional continuous-time LTI systems, and the caveat remains explicit.
