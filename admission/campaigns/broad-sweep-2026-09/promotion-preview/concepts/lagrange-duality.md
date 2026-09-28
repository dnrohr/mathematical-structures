---
canonical_name: Lagrange duality
node_type: principle
status: established
summary: Lagrange duality represents a constrained optimization problem by a dual lower-bound
  problem obtained from the infimum of its Lagrangian.
fields:
  - numerical-analysis
  - optimization
assumptions:
  - well-defined Lagrangian
canonical_examples:
  - Finite-dimensional constrained optimization. — Minimization problems with equality and
    inequality constraints.
sections:
  - campaign-broad-sweep-2026-09#lagrange-duality
---

Lagrange duality represents a constrained optimization problem by a dual lower-bound problem obtained from the infimum of its Lagrangian.

## Mathematical skeleton

The dual function g(lambda,nu) is the infimum over x of the Lagrangian and never exceeds the primal optimum for dual-feasible multipliers.

The claim is scoped to Finite-dimensional constrained optimization. Its stated validity regime is: Weak duality always; strong duality only under added regularity such as Slater conditions in convex problems.

## Boundaries

- A duality gap can remain outside strong-duality conditions.

Counterexamples and failure probes:

- A nonconvex problem with positive duality gap.

## Adversarial review

**Challenge.** Strong duality is not automatic from writing a Lagrangian.

**Response.** The claim separates unconditional weak duality from qualified strong duality.
