---
canonical_name: Lyapunov functions
node_type: principle
status: established
summary: A Lyapunov function certifies stability by decreasing along trajectories while measuring
  displacement from an equilibrium or invariant set.
fields:
  - control
  - mechanics
assumptions:
  - regular candidate function
  - derivative sign conditions
canonical_examples:
  - Local nonlinear stability of equilibria and invariant sets. — Positive-definite Lyapunov
    functions with sign-controlled orbital derivative.
sections:
  - campaign-broad-sweep-2026-09#lyapunov-functions
---

A Lyapunov function certifies stability by decreasing along trajectories while measuring displacement from an equilibrium or invariant set.

## Mathematical skeleton

V is positive definite and its derivative along the vector field is nonpositive for stability, negative definite for asymptotic conclusions under standard hypotheses.

The claim is scoped to Local nonlinear stability of equilibria and invariant sets. Its stated validity regime is: The neighborhood where definiteness and derivative conditions hold.

## Boundaries

- Failure to find a Lyapunov function is not proof of instability.

Counterexamples and failure probes:

- A positive function increasing along trajectories does not certify stability.

## Adversarial review

**Challenge.** Negative semidefinite derivative alone may not imply asymptotic stability.

**Response.** The claim distinguishes stability from stronger conclusions and invokes added hypotheses.
