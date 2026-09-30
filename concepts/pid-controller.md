---
canonical_name: PID controller
node_type: operation
status: established
summary: A PID controller combines proportional, integral, and derivative actions on tracking error.
fields:
  - control
  - mechanics
assumptions:
  - measured tracking error
canonical_examples:
  - Single-loop feedback with implementable filtering and anti-windup provisions. — Single-loop
    feedback with implementable filtering and anti-windup provisions.
sections:
  - campaign-cross-field-sweep-2026-09#pid-controller
---

A PID controller combines proportional, integral, and derivative actions on tracking error.

## Mathematical skeleton

The control signal weights present error, accumulated error, and error rate.

The claim is scoped to Single-loop feedback with implementable filtering and anti-windup provisions. Its stated validity regime is: The stated claim is limited to single-loop feedback with implementable filtering and anti-windup provisions.

## Boundaries

- Derivative action amplifies measurement noise and integral action can wind up.

Counterexamples and failure probes:

- An ideal differentiator driven by white measurement noise has unbounded output variance.

## Adversarial review

**Challenge.** Boundary test: Derivative action amplifies measurement noise and integral action can wind up.

**Response.** The proposition is restricted to single-loop feedback with implementable filtering and anti-windup provisions, and the caveat remains explicit.
