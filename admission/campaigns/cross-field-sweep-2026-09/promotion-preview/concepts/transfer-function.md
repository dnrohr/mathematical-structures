---
canonical_name: Transfer function
node_type: dialect
status: established
summary: A transfer function is the frequency-domain input-output representation of an LTI
  state-space model under zero initial conditions.
fields:
  - control
  - mechanics
assumptions:
  - zero initial condition
  - Laplace transform exists
canonical_examples:
  - Finite-dimensional linear time-invariant systems. — Finite-dimensional linear time-invariant
    systems.
sections:
  - campaign-cross-field-sweep-2026-09#transfer-function
---

A transfer function is the frequency-domain input-output representation of an LTI state-space model under zero initial conditions.

## Mathematical skeleton

G(s)=C(sI-A)^{-1}B+D maps transformed inputs to outputs.

The claim is scoped to Finite-dimensional linear time-invariant systems. Its stated validity regime is: The stated claim is limited to finite-dimensional linear time-invariant systems.

## Boundaries

- Different state realizations can share the same transfer function.

Counterexamples and failure probes:

- Unobservable internal modes do not appear in the transfer function.

## Adversarial review

**Challenge.** Boundary test: Different state realizations can share the same transfer function.

**Response.** The proposition is restricted to finite-dimensional linear time-invariant systems, and the caveat remains explicit.
