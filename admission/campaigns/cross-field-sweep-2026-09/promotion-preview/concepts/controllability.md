---
canonical_name: Controllability
node_type: principle
status: established
summary: Controllability determines whether inputs can steer a linear state-space model between
  states in finite time.
fields:
  - control
  - mechanics
assumptions:
  - unconstrained inputs
canonical_examples:
  - Finite-dimensional continuous-time LTI systems. — Finite-dimensional continuous-time LTI systems.
sections:
  - campaign-cross-field-sweep-2026-09#controllability
---

Controllability determines whether inputs can steer a linear state-space model between states in finite time.

## Mathematical skeleton

Full rank of the controllability matrix characterizes reachability for finite-dimensional LTI systems.

The claim is scoped to Finite-dimensional continuous-time LTI systems. Its stated validity regime is: The stated claim is limited to finite-dimensional continuous-time LTI systems.

## Boundaries

- Input constraints can obstruct steering despite algebraic controllability.

Counterexamples and failure probes:

- A saturated actuator may not reach a distant state in the allotted time.

## Adversarial review

**Challenge.** Boundary test: Input constraints can obstruct steering despite algebraic controllability.

**Response.** The proposition is restricted to finite-dimensional continuous-time LTI systems, and the caveat remains explicit.
